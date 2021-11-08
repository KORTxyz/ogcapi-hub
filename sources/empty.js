module.exports = {

  getCollections: (file) => {
    
     return [
      {
        id: "placeholder",
        title: "placeholder",
        desc: "placeholder",
        extent: {
          spatial:"placeholder"
        },
        format: format == "pbf" ? "application/vnd.vector-tile" : "image/" + format,
        minzoom: "placeholder",
        maxzooom: "placeholder",
        source: {
          type: "mbtiles",
          path: "placeholder"
        },
        vector_layers: json ? JSON.parse(json) : null
      }
    ]
  },

  getTile: (file, z, x, y) => {

  },

  getItem: (file, z, x, y) => {

  }
}