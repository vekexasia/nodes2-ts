import { describe, expect, it } from 'vitest';
import { S2CellId } from '../src/S2CellId';
import { S2LatLng } from '../src/S2LatLng';

describe('Issue #47 - signed decimal S2CellId output', () => {
  it('should expose the canonical positive decimal id for points around longitude -90°', () => {
    const cellId = S2CellId.fromPoint(S2LatLng.fromDegrees(0, -90).toPoint());

    // v4: id is already unsigned bigint — toString() returns the unsigned decimal
    expect(cellId.id.toString()).toBe('10376293541461622785');
    expect(cellId.toToken()).toBe('9000000000000001');
  });

  it('shows signed and unsigned decimal strings produce the same token', () => {
    const signedIds = [
      '-8839064871157891072',
      '-8839064869010407424',
      '-8070450539764121600',
      '-8070450533321670656',
      '-8070450531174187008',
      '-8070450524731736064',
      '-7301836195485450240',
      '-7301836193337966592',
    ];

    const unsignedIds = [
      '9607679202551660544',
      '9607679204699144192',
      '10376293533945430016',
      '10376293540387880960',
      '10376293542535364608',
      '10376293548977815552',
      '11144907878224101376',
      '11144907880371585024',
    ];

    // Both signed and unsigned decimal strings produce the same token
    expect(signedIds.map((id) => new S2CellId(id).toToken())).toEqual(
      unsignedIds.map((id) => new S2CellId(id).toToken()),
    );

    // The id stored is always the unsigned value
    signedIds.forEach((signed, idx) => {
      expect(new S2CellId(signed).id.toString()).toBe(unsignedIds[idx]);
    });
  });
});
