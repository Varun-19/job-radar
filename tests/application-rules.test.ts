import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requiresCorrectionNote} from '@jobradar/domain';
test('forward stages and initial resume choice are ordinary updates',()=>{assert.equal(requiresCorrectionNote('preparing','applied',true),false);assert.equal(requiresCorrectionNote('applied','final',false),false);});
test('reopening, backwards movement and submitted resume changes require explanation',()=>{assert.equal(requiresCorrectionNote('rejected','recruiter',false),true);assert.equal(requiresCorrectionNote('technical','applied',false),true);assert.equal(requiresCorrectionNote('applied','applied',true),true);});
