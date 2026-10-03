import test from "node:test";
import assert from "node:assert/strict";
import { checkEligibility } from "../src/lib/dmv-eligibility.js";
const ready = {
  purpose: "license",
  citizen: "yes",
  identity: "citizen",
  sixpoints: "yes",
  dob: "yes",
  ssn: "card",
  residency: "2",
  documents: "yes",
};
test("citizen all ready; noncitizen Enhanced blocked; lacking lawful status does not block Standard license", () => {
  assert.deepEqual(
    Object.values(checkEligibility(ready)).map((r) => r.state),
    ["ready", "ready", "ready"],
  );
  const non = checkEligibility({ ...ready, citizen: "no", identity: "green" });
  assert.equal(non["REAL ID"].state, "ready");
  assert.equal(non.Enhanced.state, "ineligible");
  const no = checkEligibility({
    ...ready,
    citizen: "no",
    identity: "none",
    ssn: "never",
    residency: "1",
  });
  assert.equal(no.Standard.state, "ready");
  assert.equal(no["REAL ID"].state, "missing");
  assert.equal(
    checkEligibility({ ...ready, purpose: "id", identity: "none" }).Standard
      .state,
    "missing",
  );
});
test("REAL ID accepts SSN number; Enhanced requires card/valid NY document alternative; address count independent", () => {
  assert.equal(
    checkEligibility({ ...ready, ssn: "number" })["REAL ID"].state,
    "ready",
  );
  assert.equal(
    checkEligibility({ ...ready, ssn: "number" }).Enhanced.state,
    "missing",
  );
  assert.equal(
    checkEligibility({ ...ready, ssn: "ineligible" })["REAL ID"].state,
    "ready",
  );
  assert.equal(
    checkEligibility({ ...ready, ssn: "ineligible" }).Standard.state,
    "ready",
  );
  assert.equal(
    checkEligibility({ ...ready, ssn: "ineligible" }).Enhanced.state,
    "missing",
  );
  assert.match(
    checkEligibility({ ...ready, residency: "1" })["REAL ID"].missing.join(),
    /还缺1份/,
  );
  assert.equal(
    checkEligibility({ ...ready, documents: "unsure" }).Standard.state,
    "missing",
  );
  assert.equal(
    checkEligibility({ ...ready, identity: "green" }).Standard.state,
    "missing",
  );
});
