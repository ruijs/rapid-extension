import { SdRpdDataDictionary, SdRpdEntity } from "./rapid-app-def-types";

export interface AppDefinition {
  entities: SdRpdEntity[],
  dataDictionaries: SdRpdDataDictionary[],
}
let appDef: AppDefinition;

export default {
  setAppDefinition(def: AppDefinition) {
    appDef = def;
  },

  getEntities() {
    return appDef.entities;
  },

  getDataDictionaries() {
    return appDef.dataDictionaries;
  }
}