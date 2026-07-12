export type GameSize=5|8|11
export interface FieldSpec{length:number;width:number;goalWidth:number;centerRadius:number;cornerRadius:number;penaltyMark:number;secondPenaltyMark?:number;penaltyArcRadius?:number;penaltyAreaRadius?:number;goalArea?:{depth:number;width:number};penaltyArea?:{depth:number;width:number};offsideDistance?:number}
export const FIELD_SPECS:Record<GameSize,FieldSpec>={
  5:{length:40,width:20,goalWidth:3,centerRadius:3,cornerRadius:.25,penaltyMark:6,secondPenaltyMark:10,penaltyAreaRadius:6},
  8:{length:60,width:45,goalWidth:6,centerRadius:6,cornerRadius:.6,penaltyMark:9,penaltyArcRadius:6,goalArea:{depth:3,width:12},penaltyArea:{depth:9,width:24},offsideDistance:12},
  11:{length:105,width:68,goalWidth:7.32,centerRadius:9.15,cornerRadius:1,penaltyMark:11,penaltyArcRadius:9.15,goalArea:{depth:5.5,width:18.32},penaltyArea:{depth:16.5,width:40.32}}
}
export function fieldAspect(game:GameSize){const f=FIELD_SPECS[game];return f.width/f.length}
