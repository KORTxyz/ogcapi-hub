const Database = require('better-sqlite3');
const bboxPolygon = require('@turf/bbox-Polygon').default;

const { config } = process.env;

module.exports = {

  load: () => {
    configDb = new Database(config)
    configDb.loadExtension('./mod_spatialite');
  },

  empty: () => {
    configDb.exec(`
      DELETE FROM collections;
      DELETE FROM sources;
      DELETE FROM styles;
    `);
  },

  getUser: (username,password) => {
    const sql = "SELECT * FROM users WHERE username=? and password=?"

    return configDb.prepare(sql).get(username,password)
  },

  getToken: (token) => {
    const sql = "SELECT * FROM tokens WHERE token=?"

    return configDb.prepare(sql).get(token)
  },


  getCollections: (q, keywords, limit, offset, bbox) => {
    limit = limit || 10;
    offset = offset || 0;

    q = q ? `
      (title LIKE '%${q}%' OR desc LIKE '%${q}%' )
    ` : "1=1";

    keywords = keywords ? `
      AND ${[].concat(keywords.split(" ")).map(keyword => "keywords LIKE '%"+keyword+"%'" ).join(" AND ") }
    `: "";

    bbox = bbox ? `
      AND INTERSECTS(bbox,BuildMbr(${bbox})) AND
      ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = 'collections' and f_geometry_column = 'bbox' AND search_frame = BuildMbr(${bbox}) 	) 
    `: "";


    const sql = `
    SELECT 
    c.id,title,desc,json(keywords) as keywords, AsGeoJSON(bbox) as bounds,
    json_object(s.type,
        json_object('path',s.path,'format',s.format)
      ) sources
    FROM collections c, sources s 
    WHERE ${q} ${bbox} ${keywords} AND c.id=s.id 
    ORDER BY title 
    LIMIT ? 
    OFFSET ? 
    `;

    return configDb.prepare(sql).all(limit, offset);
  },

  getCollection: (collectionId) => {
    const sql = `
    SELECT 
    c.id,title,desc,json(keywords) as keywords, AsGeoJSON(bbox) as bounds, 
    json_object(s.type,
        json_object('path',s.path,'format',s.format)
      ) sources
    FROM collections c, sources s 
    WHERE c.id=? AND c.id=s.id 
    `;

    return configDb.prepare(sql).get(collectionId)
  },
  
  getSources: (collectionId) => {
    const sql = "SELECT * FROM sources WHERE id=?"

    return configDb.prepare(sql).get(collectionId)
  },

  getSource: (collectionId,type) => {
    const sql = "SELECT * FROM sources WHERE id=? AND type=?"
    return configDb.prepare(sql).get(collectionId,type)
  },

  addCollection: (collection) => {

    const { id, title, desc, tiles, items, keywords, bbox, sources} = collection;
    const geom = bboxPolygon(bbox).geometry;
     
    const sql = "INSERT INTO collections(id,title,desc,keywords,tiles,items,bbox) VALUES(?,?,?,?,?,?,SetSRID(GeomFromGeoJSON(?),4326) )";
    try {
      configDb.prepare(sql).run(id, title, desc, JSON.stringify(keywords), tiles, items, JSON.stringify(geom));
      console.log("Adding:",id)
    } catch (err) {
      console.error("ERROR adding:",id,err.code,err)
    }
    
    [].concat(sources).forEach(source => {
      const {id, type, format, path} = source;
      const sql = "INSERT INTO sources(id,type,format,path) VALUES(?,?,?,?)";
      configDb.prepare(sql).run(id, type, format, path);
    });


  },

  getStyles: (collectionId) => {
    const sql = "SELECT id FROM styles WHERE collection=?"

    return configDb.prepare(sql).all(collectionId)
  },

  getStyle: (collectionId, styleId) => {
    const sql = "SELECT json(style) as style FROM styles WHERE collection=? AND id=?"

    return configDb.prepare(sql).get(collectionId, styleId)
  },

  addStyle: (collectionId, styleId, style) => {
    style = JSON.stringify(style,null,2)

    const sql = "INSERT INTO styles(collection,id,style) VALUES(?,?,?)"
    
    return configDb.prepare(sql).run(collectionId, styleId, style);

  },

}