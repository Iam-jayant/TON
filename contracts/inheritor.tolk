;; Inheritor TON contract (Tolk DSL)
;; This contract keeps nominee metadata and allows a trusted oracle
;; to sweep the owner's wallet once the inactivity threshold is reached.

pragma tolk 0.1.0;

const OP_REGISTER_POLICY = 0x4e494e48; ;; 'NINH'
const OP_PING = 0x50494e47; ;; 'PING'
const OP_DECLARE_INACTIVE = 0x44454144; ;; 'DEAD'
const OP_RESET = 0x52455354; ;; 'REST'

struct Nominee {
  slice wallet;
  int share; ;; basis points (0-10000)
  cell meta; ;; email hash, razorpay ids etc.
}

struct Policy {
  slice owner;
  int inactivity_ts;
  int last_ping_ts;
  cell nominees_dict;
}

global slice g_oracle_key;
global map slice -> Policy g_policies;

int get_now() asm "NOW";

int is_oracle(slice key) inline {
  return equal_slices(key, g_oracle_key);
}

() recv_internal(int msg_value, cell in_msg_full, slice in_msg) impure {
  var op = in_msg~load_uint(32);
  if (op == OP_REGISTER_POLICY) {
    register_policy(in_msg);
    return ();
  }
  if (op == OP_PING) {
    ping(in_msg);
    return ();
  }
  if (op == OP_DECLARE_INACTIVE) {
    declare_inactive(msg_value, in_msg);
    return ();
  }
  if (op == OP_RESET) {
    reset_policy(in_msg);
    return ();
  }
  throw(100);
}

() register_policy(slice body) impure {
  var owner = body~load_msg_addr();
  var inactivity_days = body~load_uint(16);
  var nominees_dict = body~load_dict();

  var policy = Policy{
    owner = owner,
    inactivity_ts = get_now() + (inactivity_days * 86400),
    last_ping_ts = get_now(),
    nominees_dict = nominees_dict
  };
  g_policies.set(owner, policy);
}

() ping(slice body) impure {
  var owner = body~load_msg_addr();
  var signer = body~load_msg_addr();
  if (!equal_slices(owner, signer)) {
    throw(101);
  }
  var policy = g_policies.fetch(owner) ?= throw(200);
  policy.last_ping_ts = get_now();
  policy.inactivity_ts = get_now() + (policy.inactivity_ts - policy.last_ping_ts);
  g_policies.set(owner, policy);
}

() declare_inactive(int msg_value, slice body) impure {
  var oracle = body~load_msg_addr();
  if (!is_oracle(oracle)) {
    throw(300);
  }
  var owner = body~load_msg_addr();
  var policy = g_policies.fetch(owner) ?= throw(404);
  if (policy.last_ping_ts + (policy.inactivity_ts - policy.last_ping_ts) > get_now()) {
    throw(409);
  }
  ;; send all balance to backend settlement wallet
  var backend = body~load_msg_addr();
  send_raw_message(begin_cell()
    .store_uint(0x18, 6)
    .store_slice(backend)
    .store_coins(msg_value - 1_000_000)
    .end_cell(), 64);
}

() reset_policy(slice body) impure {
  var owner = body~load_msg_addr();
  g_policies.delete(owner);
}

