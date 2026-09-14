export const sensors=[
 {key:'TGS2600',name:'TGS2600',gas:'Air contaminants',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'TGS2602',name:'TGS2602',gas:'VOC / ammonia',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'TGS822',name:'TGS822',gas:'Organic vapours',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MQ3',name:'MQ3',gas:'Alcohol / VOC',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MQ135',name:'MQ135',gas:'Air quality',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MQ138',name:'MQ138',gas:'VOC / solvents',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MiCS_NO2',name:'MiCS NO2',gas:'Nitrogen dioxide',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MiCS_NH3',name:'MiCS NH3',gas:'Ammonia',min:-1,max:2,step:.01,unit:'dR/R0'},
 {key:'MiCS_CO',name:'MiCS CO',gas:'Carbon monoxide',min:-1,max:2,step:.01,unit:'dR/R0'}
];
export const presets={
 Healthy:{temperature:25,humidity:60,values:{TGS2600:.05,TGS2602:.04,TGS822:.03,MQ3:.03,MQ135:.04,MQ138:.03,MiCS_NO2:.04,MiCS_NH3:.04,MiCS_CO:.03}},
 'Early Pest':{temperature:27,humidity:65,values:{TGS2600:.14,TGS2602:.19,TGS822:.12,MQ3:.11,MQ135:.16,MQ138:.13,MiCS_NO2:.42,MiCS_NH3:.36,MiCS_CO:.18}},
 'High Pest':{temperature:29,humidity:72,values:{TGS2600:.30,TGS2602:.38,TGS822:.28,MQ3:.25,MQ135:.33,MQ138:.29,MiCS_NO2:.78,MiCS_NH3:.68,MiCS_CO:.36}},
 'Mechanical Stress':{temperature:31,humidity:55,values:{TGS2600:.22,TGS2602:.18,TGS822:.17,MQ3:.15,MQ135:.23,MQ138:.16,MiCS_NO2:.20,MiCS_NH3:.18,MiCS_CO:.22}}
};