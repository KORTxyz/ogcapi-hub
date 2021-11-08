const { baseurl, title, desc } = process.env;
const bbox = require('@turf/bbox').default

module.exports = {
  landingPage: () => {
    const { baseurl, title, description } = process.env;
    return {
      "title": title || "OGC API",
      "description": description || "",
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document",
          "href": baseurl + "?f=json"
        },
        {
          "rel": "conformance",
          "type": "application/json",
          "title": "OGC API conformance classes implemented by this server",
          "href": baseurl + "/conformance"
        },
        {
          "rel": "service-desc",
          "type": "application/vnd.oai.openapi+json;version=3.0",
          "title": "OpenAPI 3.0 Definition of the API in json",
          "href": baseurl + "/api/json"
        },
        {
          "rel": "service-desc",
          "type": "application/vnd.oai.openapi;version=3.0",
          "title": "OpenAPI 3.0 Definition of the API in yaml",
          "href": baseurl + "/api/yaml"
        },
        {
          "rel": "service-doc",
          "type": "text/html",
          "title": "Documentation of the API",
          "href": baseurl + "/api/static/index.html"
        },
        {
          "rel": "data",
          "type": "application/json",
          "title": "Access the data",
          "href": baseurl + "/collections?f=json"
        },
        {
          "rel": "tiling-schemes",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/tileMatrixSets"
        },
        {
          "rel": "tiles",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/tiles"
        },
        {
          "rel": "styles",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/styles"
        },
        {
          "rel": "map",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/map"
        },
      ],
      "extent": {
        "spatial": {
          "bbox": [
            [
              35.7550727,
              32.3573507,
              37.2052764,
              33.2671397
            ]
          ],
          "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
        },
        "temporal": {
          "interval": [
            [
              "2009-03-15T11:18:23Z",
              "2015-12-28T15:16:51Z"
            ]
          ],
          "trs": "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian"
        }
      }
    }

  },

  conformance: () => {
    return [
      "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/collections",

      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',

      "http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-tiles-1/1.0/req/tileset",

      "http://www.opengis.net/spec/ogcapi-maps-1/1.0/req/core"
    ]
  },

  collections: collections => {

    return {
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": baseurl + "/collections?f=json"
        },
        {
          "rel": "alternate",
          "type": "text/html",
          "title": "This document as HTML",
          "href": baseurl + "/collections?f=html"
        }
      ],
      "collections": collections.map(collection => module.exports.collection(collection))
    }
  },

  collection: collection => {
    let { id, title, desc, keywords, thumbnail, bounds, sources } = collection;
    sources = JSON.parse(sources)

    return {
      "id": id,
      "title": title,
      "description": desc,
      "thumbnail": thumbnail || "data:image/jpeg;base64,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",
      "keywords": JSON.parse(keywords),
      "extent": {
        "spatial": bbox(JSON.parse(bounds))
      },
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": baseurl + "/collections/" + id + "?f=json"
        },
        {
          "rel": "alternate",
          "type": "text/html",
          "title": "This document as HTML",
          "href": baseurl + "/collections/" + id + "?f=html"
        },
        //...module.exports.itemLinks(sources, id),
        ...module.exports.tilesLinks(sources, id),
        ...module.exports.enclosureLinks(sources, id)
      ].filter(e => e != null)
    }
  },

  itemLinks: (items, id) => {
    return items ?
      [{
        "rel": "items",
        "type": "application/geo+json",
        "title": "Access the features in the collection as GeoJSON",
        "href": baseurl + "/collections/" + id + "/items?f=json"
      },
      {
        "rel": "items",
        "type": "text/html",
        "title": "Access the features in the collection as HTML",
        "href": baseurl + "/collections/" + id + "/items?f=html"
      }]
      :
      [];
  },

  tilesLinks: (sources, id) => {
    return Object.keys(sources).includes("mbtiles") ?
      [{
        "rel": "tiling-schemes",
        "type": "application/json",
        "title": "Access tiling-schemes for this collection",
        "href": baseurl + "/collections/" + id + "/tiles"
      },
      {
        "rel": "tiles",
        "type": sources.mbtiles.format,
        "title": "Access the features in the collection as tiles",
        "href": baseurl + "/collections/" + id + "/tiles/{tileMatrixSetId}/{tileMatrixId}/{tileRow}/{tileCol}",
        "templated": true
      }]
      :
      [];
  },

  enclosureLinks: (sources, id) => {
    return Object.keys(sources).map(source => {
      return {
        "rel": "enclosure",
        "type": source,
        "title": "Download collection as " + source,
        "href": baseurl + "/collections/" + id + "/download?f=" + source
      }
    })

  },

  tilesSets: (collectionId) => {
    const collectionPath = collectionId ? "/collections/" + collectionId : ""

    return {
      "title": title || "OGCAPI",
      "description": desc || "",
      "links": [{
        "rel": "self",
        "type": "application/json",
        "title": "The JSON representation of the available map tilesets for the dataset",
        "href": baseurl + collectionPath + "/tiles?f=json"
      },
      {
        "rel": "item",
        "type": "application/vnd.mapbox-vector-tile",
        "title": "Mapbox vector tiles; the link is a URI template where {tileMatrix}/{tileRow}/{tileCol} is the tile based on the tiling scheme {tileMatrixSetId}",
        "href": baseurl + collectionPath + "/tiles/{tileMatrixSetId}/{z}/{x}/{y}",
        "templated": true
      },
      {
        "rel": "describedby",
        "type": "application/json",
        "title": "Metadata for these tiles in the TileJSON format",
        "href": baseurl + collectionPath + "/tiles/{tileMatrixSetId}",
        "templated": true
      }
      ],
      "tileMatrixSetLinks": [
        {
          "tileMatrixSet": "WebMercatorQuad",
          "tileMatrixSetURI": "http://www.opengis.net/def/tilematrixset/OGC/1.0/WebMercatorQuad",
          "tileMatrixSetDefinition": baseurl + "/tileMatrixSets/WebMercatorQuad",
        }
      ]
    }
  },

  tileJSON: (collection) => {
    let { id, title, desc, bounds, vectorlayers } = collection;
    bounds = bbox(JSON.parse(bounds));
    const collectionPath = id ? "/collections/" + id : ""

    return {
      "tilejson": "3.0.0",
      "name": title,
      "description": desc,
      "tiles": [baseurl + collectionPath + "/tiles/WebMercatorQuad/{z}/{y}/{x}"],
      "vector_layers": JSON.parse(vectorlayers),
      "bounds": bounds,
      "center": [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2, 7],
      "minzoom": 0,
      "maxzoom": 18
    };
  },

  styles: (collectionId, styles) => {
    const url = baseurl + (collectionId ? "/collections/" + collectionId : "");

    return {
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": url + "/styles?f=json"
        }
      ],
      "styles": styles.map(style => module.exports.style(collectionId, style))
    }
  },

  style: (collectionId, style) => {
    const url = baseurl + (collectionId ? "/collections/" + collectionId : "");

    return {
      "id": style.id,
      "title": style.title || style.id,
      "links": [
        {
          "href": url + "/styles/" + style.id + "?f=mapbox",
          "type": "application/vnd.mapbox.style+json",
          "rel": "stylesheet"
        },
        {
          "href": url + "/styles/" + style.id + "/metadata?f=json",
          "type": "application/json",
          "rel": "describedby"
        }
      ]
    }
  },

  styleMetadata: (style) => {
    return {
      "id": style.id,
      "title": style.title || style.id,
      "scope": "style",
      "stylesheets": [
        {
          "title": "Mapbox Style",
          "version": "8",
          "specification": "https://docs.mapbox.com/mapbox-gl-js/style-spec/",
          "native": true,
          "tilingScheme": "webmercator",
          "link": {
            "href": baseurl + "/styles/" + style.id + "?f=mapbox",
            "type": "application/vnd.mapbox.style+json",
            "rel": "stylesheet"
          }
        }
      ],
      "links": [
        {
          "href": baseurl + "/styles/" + style.id + "/metadata?f=json",
          "type": "application/json",
          "rel": "self"
        }
      ]
    }
  },

}
