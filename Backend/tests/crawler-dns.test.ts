import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicAddress, selectPublicAddress } from "../modules/crawlers/crawler.middleware";

test("recognizes public NAT64 destinations returned for Vidorahub", () => {
  assert.equal(isPublicAddress("64:ff9b::401d:1101"), true);
  assert.equal(isPublicAddress("64:ff9b::d8c6:4f41"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("NAT64 must not bypass private, loopback, metadata, or reserved address checks", () => {
  for (const address of [
    "64:ff9b::7f00:1", "64:ff9b::a00:1", "64:ff9b::c0a8:101",
    "64:ff9b::a9fe:a9fe", "64:ff9b::6440:1", "64:ff9b::c000:201",
    "64:ff9b::", "64:ff9b:1::1", "::ffff:127.0.0.1", "::1",
  ]) assert.equal(isPublicAddress(address), false, address);
});

test("Vidorahub mixed DNS records prefer a public IPv4 answer", () => {
  const result = selectPublicAddress([
    { address: "64:ff9b::401d:1101", family: 6 },
    { address: "64:ff9b::d8c6:4f41", family: 6 },
    { address: "64.29.17.1", family: 4 },
    { address: "216.198.79.65", family: 4 },
  ]);
  assert.deepEqual(result, { address: "64.29.17.1", family: 4 });
});

test("mixed private/public DNS selects only the pinned public address", () => {
  assert.deepEqual(selectPublicAddress([
    { address: "127.0.0.1", family: 4 }, { address: "8.8.8.8", family: 4 },
  ]), { address: "8.8.8.8", family: 4 });
  assert.deepEqual(selectPublicAddress([{ address: "64:ff9b::808:808", family: 6 }]),
    { address: "64:ff9b::808:808", family: 6 });
  assert.throws(() => selectPublicAddress([{ address: "10.0.0.1", family: 4 }]));
  assert.throws(() => selectPublicAddress([]));
});
