import bytes from 'bytes'
import sizeof from 'object-sizeof'
import { Type } from 'class-transformer'
import { GarmentEnv } from './enums'

export class CatalogItem {
  static api: any

  id: number
  uid: string
  schema: string
  name: string
  description: string
  meta: Object

  @Type(() => Date)
  publishedAt: string

  @Type(() => Date)
  detachedAt: string
}

export class Repository {
  static api: any
  envPath: string
  isLoaded = false

  id: number
  uid: string
  schema: string
  name: string
  description: string
  version: string

  @Type(() => Activity)
  structure: Activity[]

  @Type(() => Date)
  publishedAt: Date

  get size(): string {
    return bytes(sizeof(this))
  }

  get path(): string {
    return Repository.api.getRepositoryPath(this.id.toString(), this.envPath)
  }

  async load() {
    const withContainers = this.structure.filter(it => it.contentContainers.length)
    await Promise.all(withContainers.map(activity => activity.load()))
    this.isLoaded = true
  }

  clone(dstPath: string) {
    return Repository.api.clone(this.path, dstPath)
  }

  snapshot(version = new Date().getTime().toString()) {
    const directory = `${this.id}/${version}`
    return Repository.api.cloneToEnv(this.path, GarmentEnv.Snapshot, directory)
  }

  getContainer(id: string) {
    return Repository.api.getContainer(id, this.id.toString())
  }
}

export class Activity {
  static api: any
  isLoaded = false

  id: number
  uid: string
  repositoryId: number
  type: string
  position: number
  relationships: Object
  meta: Object
  contentContainers: any[]

  @Type(() => Date)
  createdAt: Date

  @Type(() => Date)
  updatedAt: Date

  @Type(() => Date)
  publishedAt: Date

  async load(): Promise<any> {
    const fetchContainers = this.contentContainers.map((it) => {
      return Activity.api.getContainer(it.id.toString(), this.repositoryId.toString())
    })
    await Promise
      .all(fetchContainers)
      .then((containers) => {
        this.isLoaded = true
        this.contentContainers = containers
      })
    this.isLoaded = true
  }
}
