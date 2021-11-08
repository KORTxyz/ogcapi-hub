const Database = require('better-sqlite3');
const { parse, sep } = require('path');

module.exports = {

  getCollections: (file) => {

    const { dir } = parse(file)

    const db = new Database(file, { fileMustExist: true });
    const stmt = db.prepare('SELECT * FROM metadata');
    const { name, description, bounds, format, minzoom, maxzoom, json } = stmt.all().reduce((obj, cur) => ({ ...obj, [cur.name]: cur.value }), {});

    return [
      {
        id: name,
        title: name,
        desc: description,
        keywords: ["mbtiles",...dir.split(sep).splice(1)],
        bbox: bounds.split(",").map(e => Number(e)),
        minzoom: minzoom,
        maxzoom: maxzoom,
        tiles: "wms",
        items: "",
        sources: {
          id: name,
          type: "mbtiles",
          format: format == "pbf" ? "application/vnd.vector-tile" : "image/" + format,
          path: file
        },
        vector_layers: json ? JSON.parse(json).vector_layers : null
      }
    ]
  },

  getTile: (file, z, x, y) => {
    y = (1 << z) - y - 1;

    const db = new Database(file, { fileMustExist: true });
    const stmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level=? and tile_column=? and tile_row=?').get(z, x, y);

    return stmt?.tile_data || null;
  }

}