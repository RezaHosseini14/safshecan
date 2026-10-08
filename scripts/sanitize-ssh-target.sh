#!/usr/bin/env bash
# Normalize SSH_HOST and SSH_USER from GitHub Actions secrets.
# Secrets pasted in the GitHub UI often keep a trailing newline, which OpenSSH
# rejects as "remote username contains invalid characters".
set -euo pipefail

sanitize_field() {
  local value="$1"
  value="$(printf '%s' "$value" | tr -d '[:space:]')"
  value="${value#$'\xEF\xBB\xBF'}"
  printf '%s' "$value"
}

emit_sanitized_ssh_target() {
  local host user
  host="$(sanitize_field "${SSH_HOST:-}")"
  user="$(sanitize_field "${SSH_USER:-}")"

  if [ -z "$host" ]; then
    echo "ERROR: SSH_HOST is empty after trimming whitespace and newlines." >&2
    echo "Set the SSH_HOST Actions secret to the server hostname or IP, on one line." >&2
    return 1
  fi

  if [ -z "$user" ]; then
    echo "ERROR: SSH_USER is empty after trimming whitespace and newlines." >&2
    echo "Set the SSH_USER Actions secret to a single-line login name, for example: root" >&2
    return 1
  fi

  if ! printf '%s' "$host" | grep -Eq '^[A-Za-z0-9.:-]+$'; then
    echo "ERROR: SSH_HOST is not a hostname or IP address." >&2
    return 1
  fi

  if ! printf '%s' "$user" | grep -Eq '^[A-Za-z0-9._-]{1,32}$'; then
    echo "ERROR: SSH_USER contains characters OpenSSH rejects." >&2
    echo "Save SSH_USER as a single line, such as root. A trailing newline is removed automatically." >&2
    return 1
  fi

  printf 'host=%s\nuser=%s\n' "$host" "$user"
}

run_tests() {
  local failed=0

  expect_ok() {
    local name="$1" host_in="$2" user_in="$3" want_host="$4" want_user="$5"
    local out got_host got_user
    if ! out="$(SSH_HOST="$host_in" SSH_USER="$user_in" emit_sanitized_ssh_target 2>/tmp/ssh-sanitize-err)"; then
      echo "FAIL $name: expected success, stderr=$(cat /tmp/ssh-sanitize-err)"
      failed=1
      return
    fi
    got_host="$(printf '%s\n' "$out" | sed -n 's/^host=//p')"
    got_user="$(printf '%s\n' "$out" | sed -n 's/^user=//p')"
    if [ "$got_host" != "$want_host" ] || [ "$got_user" != "$want_user" ]; then
      echo "FAIL $name: got host='$got_host' user='$got_user', expected host='$want_host' user='$want_user'"
      failed=1
      return
    fi
    echo "ok $name"
  }

  expect_fail() {
    local name="$1" host_in="$2" user_in="$3"
    if SSH_HOST="$host_in" SSH_USER="$user_in" emit_sanitized_ssh_target >/dev/null 2>/tmp/ssh-sanitize-err; then
      echo "FAIL $name: expected failure"
      failed=1
      return
    fi
    if ! grep -q '^ERROR:' /tmp/ssh-sanitize-err; then
      echo "FAIL $name: missing ERROR message, stderr=$(cat /tmp/ssh-sanitize-err)"
      failed=1
      return
    fi
    echo "ok $name"
  }

  expect_ok "trailing newlines" $'203.0.113.10\n' $'root\n' "203.0.113.10" "root"
  expect_ok "crlf and spaces" $' 203.0.113.10 \r\n' $'\r\n deploy \n' "203.0.113.10" "deploy"
  expect_ok "ipv6 host" "2001:db8::1" "root" "2001:db8::1" "root"
  expect_ok "bom prefix" $'\xEF\xBB\xBFexample.com' "root" "example.com" "root"

  expect_fail "empty user" "203.0.113.10" $'\n'
  expect_fail "whitespace user" "203.0.113.10" $' \r\n'
  expect_fail "user with shell metacharacters" "203.0.113.10" $'root;rm\n'
  expect_fail "user that is an ssh command" "203.0.113.10" "root@host"
  expect_fail "empty host" $'\n' "root"
  expect_fail "host with slash" "203.0.113.10/24" "root"

  if [ "$failed" -ne 0 ]; then
    echo "sanitize-ssh-target tests failed"
    return 1
  fi
  echo "sanitize-ssh-target tests passed"
}

if [ "${1:-}" = "--test" ]; then
  run_tests
else
  emit_sanitized_ssh_target
fi
