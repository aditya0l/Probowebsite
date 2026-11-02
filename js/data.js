// Product data and formatting shared by the 3D pages and the light pages.
const PRICE=(window.SITE&&SITE.prices)||{};
export const PRODUCTS={
  press:{price:PRICE.press??null,name:'Iso-lateral plate-loaded press',short:'Iso-lateral press',cat:'Plate-loaded strength',g:'Strength',muscles:['chest','shoulders','arms'],blurb:'Spin it, load it, take it apart. Each arm moves on its own, exactly like the one on the showroom floor.'},
  treadmill:{price:PRICE.treadmill??null,name:'Commercial treadmills',short:'Treadmills',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','cardio'],blurb:'Set the belt speed and watch it run. Built for floors that never close.'},
  bike:{price:PRICE.bike??null,name:'Spin bikes',short:'Spin bikes',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','cardio'],blurb:'Set the cadence. The flywheel and cranks follow, the way they do in a class.'},
  elliptical:{price:PRICE.elliptical??null,name:'Cross-trainers',short:'Cross-trainers',cat:'Cardio',g:'Cardio',muscles:['legs','glutes','arms','cardio'],blurb:'Low impact, full body. A cardio floor favourite for every age.'},
  station:{price:PRICE.station??null,name:'Selectorised stations',short:'Stations',cat:'Selectorised strength',g:'Strength',muscles:['back','chest','arms'],blurb:'Pin-loaded weight stack with guided arms. Easy for beginners, solid for regulars.'},
  rack:{price:PRICE.rack??null,name:'Power racks',short:'Power racks',cat:'Racks and rigs',g:'Strength',muscles:['legs','glutes','back','chest','core'],blurb:'Squat, bench and pull in one footprint, with a bar, plates and a bench.'},
  dumbbells:{price:PRICE.dumbbells??null,name:'Dumbbells and racks',short:'Dumbbells',cat:'Free weights',g:'Free weights',muscles:['arms','shoulders','chest','back'],blurb:'Hex dumbbells on two-tier racks, from light pairs to the heaviest ones on the floor.'},
  bench:{price:PRICE.bench??null,name:'Benches',short:'Benches',cat:'Free weights',g:'Free weights',muscles:['chest','arms'],blurb:'The simplest thing in the gym, and the one everyone queues for.'},
};
export const ORDER = ['press', 'treadmill', 'bike', 'elliptical', 'station', 'rack', 'dumbbells', 'bench'];
export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
