const {test}=require('node:test');const assert=require('node:assert/strict');
require('../dist/engine.js');const service=require('../dist/analysis-service.js');
const input={budget:100,spent:60,progress:50,planned:60,days:200,validated:true};
test('o adaptador demonstra a mesma fórmula e identifica o provedor',()=>{
 const result=service.evaluate(input);assert.equal(result.eac,120);assert.equal(result.duration,240);assert.deepEqual(result.metadata,{id:'earned-value-rules',version:'1.0.0',kind:'demonstrative'});
});
test('provedor substituível recebe cópia sem acesso à apresentação',()=>{
 const provider=service.create({id:'test-only',version:'test',kind:'trained',analyze(project){project.spent=90;return VanguardaEngine.calculate(project);}});
 assert.equal(provider.evaluate(input).eac,180);assert.equal(input.spent,60);assert.equal(provider.metadata.kind,'trained');
});
test('adaptador oferece caminho assíncrono explícito para endpoint futuro',async()=>{
 const provider=service.create({id:'async-test',version:'test',kind:'trained',async analyze(project){return VanguardaEngine.calculate(project);}});
 assert.throws(()=>provider.evaluate(input),/assíncrono/);assert.equal((await provider.evaluateAsync(input)).duration,240);
});
test('contrato rejeita saída ausente, negativa, não finita ou sem alertas tipados',()=>{
 for(const broken of [null,{...service.evaluate(input),eac:Infinity},{...service.evaluate(input),duration:-1},{...service.evaluate(input),alerts:[{code:'bad'}]}]) {
  const provider=service.create({id:'bad',version:'test',kind:'trained',analyze:()=>broken});assert.throws(()=>provider.evaluate(input));
 }
});
