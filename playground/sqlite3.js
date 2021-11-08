var sqlite3 = require('sqlite3').verbose();

configDb = new sqlite3.Database('test3.sqlite',{verbose:console.log})
//configDb.unsafeMode();

configDb.loadExtension('../mod_spatialite');

configDb.exec(`
      SELECT InitSpatialMetaData('WGS84_ONLY');

      DROP TABLE IF EXISTS collection;

      CREATE TABLE IF NOT EXISTS collections(
          id INTEGER,
          title TEXT,
          desc TEXT,
          items TEXT,
          tiles TEXT,
          sources TEXT,
          format TEXT,
          vectorlayers TEXT
      );
      
      SELECT AddGeometryColumn('collections', 'bbox', 4326, 'POINT', 'XY');

      SELECT CreateSpatialIndex('collections','bbox');
 `)