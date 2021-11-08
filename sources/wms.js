const fetch = require('node-fetch');
const convert = require('xml-js');

getBBOX = e => { return [].concat(e).map(e => e._attributes).filter(e => e.SRS == "EPSG:4326" || e.CRS == "EPSG:4326").map(e => { return [e.minx, e.miny, e.maxx, e.maxy] })[0].map(e => Number(e)) }

module.exports = {
  getCollections: async (path) => {
    const url = new URL(path);

    url.searchParams.set('request', 'GetCapabilities');
    url.searchParams.set('service', 'WMS');

    const WMSCapability = await fetch(url)
      .then(e => e.text())
      .then(xml => {
        const result = convert.xml2js(xml, { compact: true, ignoreComment: true});
        return result[Object.keys(result)[1]]
      })
    
    let keywords = ["wms"];
    if(WMSCapability.Service.KeywordList){      
      keywords = [keywords, ...WMSCapability.Service.KeywordList.Keyword.map(e => e._text)]
    }
    
    const { GetMap } = WMSCapability.Capability.Request;
    const getMapFormats = [].concat(GetMap.Format).map(e => e._text)

    const getMapURL = new URL(GetMap.DCPType.HTTP.Get.OnlineResource._attributes['xlink:href'])

    const { BoundingBox, Layer } = WMSCapability.Capability.Layer
    const defaultBBOX = getBBOX(BoundingBox)



    return Layer.map(layer => {
      const { Name, Title, Abstract, BoundingBox } = layer;
      const bbox = BoundingBox ? getBBOX(BoundingBox) : defaultBBOX;
      getMapURL.searchParams.set("layers",Name._text)
      return ({
        id: Name._text,
        title: Title._text,
        desc: Abstract?._text || "",
        keywords: keywords,
        bbox: bbox,
        tiles: "wms",
        items: "",
        sources: getMapFormats.map(format =>{
          getMapURL.searchParams.set("format",format)
          return {
            id: Name._text,
            type: "wms",
            format: format,
            path: getMapURL.href 
          }
        })
      })
    })

  },

  getTile: async ( path, z, x, y) => {
    const SphericalMercator = require('@mapbox/sphericalmercator')
    const merc = new SphericalMercator({ size: 256 });
    const bbox = merc.bbox(x, y, z, false, "900913")

    path = path + "&service=WMS&request=GetMap&version=1.3.0&styles=&transparent=TRUE&width=256&height=256&crs=EPSG%3A3857&bbox=" + bbox.toString()
    const image = await fetch(path).then(e => e.buffer()).then(e => { return e })
   
    return image
  }
}
