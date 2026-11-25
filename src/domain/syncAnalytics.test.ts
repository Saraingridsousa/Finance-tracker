import {describe,it,expect} from 'vitest';
import {initialTransactions,incomingBatch} from '../data/demo';
import {simulateBatch} from './syncAnalytics';
describe('synthetic synchronization reports',()=>{
 it('accounts for incoming, repeated and hidden records without losing edits',()=>{
  const initial=initialTransactions(),batch=incomingBatch();
  const first=simulateBatch(initial,batch,new Set(),1,'all');
  expect(first.report).toMatchObject({received:3,added:3,duplicates:0,hidden:0});
  const edited=first.rows.map(r=>r.id===batch[0].id?{...r,description:'Edited'}:r).filter(r=>r.id!==batch[1].id);
  const repeat=simulateBatch(edited,batch,new Set([batch[1].id]),2,'all');
  expect(repeat.report).toMatchObject({received:3,added:0,duplicates:2,hidden:1});
  expect(repeat.rows).toEqual(edited);
 });
 it('preserves existing records on communication failure',()=>{
  const rows=initialTransactions();
  const result=simulateBatch(rows,incomingBatch(),new Set(),1,'all',true);
  expect(result.rows).toBe(rows);expect(result.report).toMatchObject({status:'error',received:0,added:0});
 });
 it('counts duplicates inside a single batch',()=>{
  const batch=incomingBatch(),s=simulateBatch([], [batch[0],batch[0]],new Set(),1,'all');
  expect(s.report).toMatchObject({received:2,added:1,duplicates:1});
 });
});
