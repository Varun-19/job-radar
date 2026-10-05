import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smtpReadiness,smtpSettings} from '@jobradar/services';
const base={SMTP_HOST:'smtp.gmail.com',SMTP_FROM:'sender@example.com',JOBRADAR_ALERT_EMAIL:'recipient@example.com',SMTP_PORT:'465'};
test('Gmail cannot appear ready with missing or partial authentication',()=>{
 for(const auth of [{},{SMTP_USER:'sender@example.com'},{SMTP_PASSWORD:'private-sentinel'}]){
  const status=smtpReadiness({...base,...auth});assert.equal(status.configured,false);assert.doesNotMatch(JSON.stringify(status),/private-sentinel/);
 }
 assert.equal(smtpReadiness({...base,SMTP_USER:'sender@example.com',SMTP_PASSWORD:'private-sentinel'}).configured,true);
});
test('SMTP enforces encryption and validates addresses without exposing credentials',()=>{
 assert.equal(smtpSettings({...base,SMTP_HOST:'relay.example.com'})?.options.secure,true);
 assert.equal(smtpSettings({...base,SMTP_HOST:'relay.example.com',SMTP_PORT:'587'})?.options.requireTLS,true);
 assert.equal(smtpReadiness({...base,SMTP_PORT:'25'}).configured,false);
 assert.equal(smtpReadiness({...base,SMTP_FROM:'invalid'}).configured,false);
 assert.equal(smtpReadiness({}).configured,false);
});
