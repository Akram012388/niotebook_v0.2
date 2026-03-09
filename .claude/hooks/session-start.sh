#!/usr/bin/env bash
# SessionStart hook — re-injects compaction handoff context after compaction.
#
# Fires only when SessionStart source == "compact" (matcher: compact).
# Any text written to stdout is automatically added to Claude's context.
#
# Input (stdin): JSON with session_id, cwd, source, model
# Output (stdout): handoff file contents → injected into Claude's context

INPUT=$(cat)
CWD=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cwd',''))" 2>/dev/null)

if [ -z "$CWD" ]; then
  CWD="$CLAUDE_PROJECT_DIR"
fi

# Compute auto-memory directory: ~/.claude/projects/<slug>/memory/
# Claude slugifies the cwd by replacing ALL non-alphanumeric chars with '-'
SLUG=$(echo "$CWD" | sed 's|[^a-zA-Z0-9-]|-|g')
MEMORY_DIR="$HOME/.claude/projects/${SLUG}/memory"
HANDOFF_FILE="$MEMORY_DIR/compaction-handoff.md"

if [ -f "$HANDOFF_FILE" ]; then
  echo "=== Compaction Handoff Context ==="
  echo ""
  cat "$HANDOFF_FILE"
  echo ""
  echo "=== End Handoff Context ==="
  # Remove the file so stale state doesn't persist into future sessions
  rm -f "$HANDOFF_FILE"
fi

exit 0
