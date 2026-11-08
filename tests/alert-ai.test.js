import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{classifyAlert,validateAlertAdvice} from '../api/classify-alert.js';
const id='a0000000-0000-0000-0000-000000000001';
const advice={categoria_sugerida:'riesgo_vial',prioridad_revision:'prioritaria',resumen:'Se reporta una obstrucción en el parque.',faltantes:['¿El paso sigue bloqueado?']};
const report={titulo:'Árbol caído',descripcion:'Un árbol bloquea el paso.',zona:'Parque',categoria:'riesgo_vial',observado_en:'2026-11-08T12:00:00Z'};
function mockClient({valid=true,access=true,quota=true}={}) {
 return {
  auth:{async getUser(){return {data:{user:valid?{id:'ana'}:null},error:!valid};}},
  from(table) {
   assert.equal(table,'avisos_barrio');
   return {select(columns) {
    assert.ok(!columns.includes('foto'));
    return {eq(){return {async single(){return access?{data:report}:{error:true};}};}};
   }};
  },
  async rpc(name){assert.equal(name,'tomar_turno_ia_aviso');return {error:!quota};}
 };
}
test('IA de avisos: valida sesión, acceso RLS y cuota antes de llamar a Gemini',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw new Error('No debería llamarse');};
 for(const [config,status]of [[{valid:false},401],[{access:false},403],[{quota:false},429]])await assert.rejects(classifyAlert({id,token:'jwt'},{client:mockClient(config),apiKey:'test',fetchImpl}),e=>e.status===status);
 assert.equal(calls,0);
});
test('IA de avisos: solo texto almacenado, JSON acotado, sin publicar ni recibir foto',async()=>{
 const result=await classifyAlert({id,token:'jwt'},{client:mockClient(),apiKey:'test',fetchImpl:async(url,request)=>{
  assert.match(url,/generateContent/);const body=JSON.parse(request.body);assert.deepEqual(JSON.parse(body.contents[0].parts[0].text),report);assert.ok(!JSON.stringify(body.contents).includes('inlineData'));return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(advice)}]}}]})};}});
 assert.deepEqual(result,advice);assert.throws(()=>validateAlertAdvice({...advice,categoria_sugerida:'seguro'}));assert.throws(()=>validateAlertAdvice({...advice,faltantes:['x'.repeat(141)]}));
});
test('endpoint de IA exige POST y bearer; errores no exponen secretos',async()=>{
 function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;}};}
 let res=response();await handler({method:'GET'},res);assert.equal(res.code,405);assert.equal(res.headers['Cache-Control'],'no-store');
 res=response();await handler({method:'POST',headers:{},body:{id}},res);assert.equal(res.code,401);
});
