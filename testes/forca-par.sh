#!/bin/bash
# uso: forca-par.sh REPS MESA PROCS
for i in $(seq 1 ${3:-4}); do node testes/forca.js $1 $2 s$i > /tmp/fp_$i.txt & done; wait
node -e "
const fs=require('fs');const t={},c=0;let k=0;
for(let i=1;i<=${3:-4};i++){const m=fs.readFileSync('/tmp/fp_'+i+'.txt','utf8').match(/\{.*\}/);const o=JSON.parse(m[0]);for(const x in o){t[x]=(t[x]||0)+o[x];}k++}
for(const x in t)t[x]=+(t[x]/k).toFixed(1);console.log('mesa ${2}',JSON.stringify(t),'(media de '+k+' lotes)')"
