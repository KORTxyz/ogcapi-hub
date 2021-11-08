const db = require('better-sqlite3')(':memory:', { verbose: console.log } );
      db.loadExtension('./mod_spatialite')

db.prepare("SELECT InitSpatialMetaData('WGS84_ONLY')").run();
