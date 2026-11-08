'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {regionForPoint}=require('../src/renderer/interaction.js');
test('touch regions distinguish head, belly and remaining body',()=>{
 for(const point of [[300,180],[220,240],[370,270]])assert.equal(regionForPoint(...point),'head');
 for(const point of [[300,400],[270,440],[340,425]])assert.equal(regionForPoint(...point),'belly');
 assert.equal(regionForPoint(470,400),'body');
 assert.equal(regionForPoint(300,550),'body');
});
