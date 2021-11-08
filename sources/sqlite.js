const Database = require("better-sqlite3");
const path = require("path");

module.exports = {
  getCollections: (file) => {
    const { name, dir } = path.parse(file);

    const db = new Database(file, { fileMustExist: true });
    db.loadExtension("./mod_spatialite");

    const collections = db
      .prepare(
        "SELECT * FROM vector_layers_statistics LEFT JOIN geometry_columns on table_name=f_table_name WHERE row_count>0 "
      )
      .all();
    const types = [null, "circle", "line", "fill", "circle", "line", "fill"];

    return collections.map((collection) => {
      const {
        table_name,
        geometry_type,
        extent_min_x,
        extent_min_y,
        extent_max_x,
        extent_max_y,
      } = collection;

      return {
        id: name + ":" + table_name,
        title: name + ":" + table_name,
        desc: "description",
        keywords: ["sqlite", ...dir.split(path.sep).splice(1)],
        bbox: [extent_min_x, extent_min_y, extent_max_x, extent_max_y],
        minzoom: 7,
        maxzoom: 18,
        tiles: "sqlite",
        items: "sqlite",
        sources: {
          id: name + ":" + table_name,
          type: "sqlite",
          format: types[+(geometry_type + "").slice(-1)],
          path: file,
        },
        vector_layers: [
          {
            id: table_name,
            description: "",
            minzoom: 7,
            maxzoom: 18,
            fields: {},
          },
        ],
      };
    });
  },

  getTile: (file, z, x, y, collectionId) => {
    const db = new Database(file, { fileMustExist: true });
    db.loadExtension("./mod_spatialite");

    const SphericalMercator = require("@mapbox/sphericalmercator");
    const merc = new SphericalMercator({ size: 512 });

    const geojsonvt = require("geojson-vt");
    const vtpbf = require("vt-pbf");

    const bbox = merc.bbox(x, y, z);

    const { table_name, geometry_column } = db
      .prepare(
        "SELECT table_name, geometry_column FROM vector_layers_statistics WHERE table_name=?"
      )
      .get(collectionId.split(":")[1]);

    const features = db
      .prepare(
        `
        SELECT *, AsGeoJSON(${geometry_column},6) geojson FROM ${table_name} where intersects(${table_name}.${geometry_column},BuildMbr(${bbox.toString()})) AND
        ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = '${table_name}' and f_geometry_column = '${geometry_column}' AND search_frame = BuildMbr(${bbox.toString()}) 	) 
        LIMIT 1000
      `
      )
      .all();

    if (features.length == 0) return null;

    const geojson = {
      type: "FeatureCollection",
      features: features.map((feature) => {
        const properties = Object.fromEntries(Object.entries(feature).splice(1,Object.entries(feature).length-3))

        return {
          id: Object.values(feature)[0],
          type: "Feature",
          properties: properties,
          geometry: JSON.parse(feature.geojson),
        };
      }),
    };
    
    let tileIndex = geojsonvt(geojson, { maxZoom: 20 });
    let tile = tileIndex.getTile(parseInt(z), parseInt(x), parseInt(y));

    let Obj = {};
    Obj[table_name] = tile;

    const pbf = vtpbf.fromGeojsonVt(Obj, { version: 2 });

    return Buffer.from(pbf);
  },

  getItem: (file, geometryColumn, where, limit, offset) => {
    const db = new Database(file, { fileMustExist: true });
    db.loadExtension("./mod_spatialite");
  },
};
