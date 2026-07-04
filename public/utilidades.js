// Utilidades compartidas entre módulos de la pizarra
(function(){

window.fmtMin = function(ms){
  const t = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return t + ':' + String(s).padStart(2, '0');
};

})();
