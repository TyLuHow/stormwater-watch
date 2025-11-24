declare module '@mapbox/mapbox-gl-draw' {
  import { IControl } from 'mapbox-gl'
  import type { FeatureCollection } from 'geojson'

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean
    controls?: {
      point?: boolean
      line_string?: boolean
      polygon?: boolean
      trash?: boolean
      combine_features?: boolean
      uncombine_features?: boolean
    }
    defaultMode?: string
    modes?: any
    styles?: any[]
    userProperties?: boolean
  }

  export default class MapboxDraw implements IControl {
    constructor(options?: MapboxDrawOptions)
    onAdd(map: any): HTMLElement
    onRemove(map: any): void
    getAll(): FeatureCollection
    add(geojson: any): string[]
    delete(ids: string | string[]): this
    deleteAll(): this
    set(featureCollection: FeatureCollection): string[]
    get(id: string): any
    getSelected(): FeatureCollection
    getSelectedIds(): string[]
    getSelectedPoints(): FeatureCollection
    getMode(): string
    changeMode(mode: string, options?: any): this
    trash(): this
    combineFeatures(): this
    uncombineFeatures(): this
  }
}
