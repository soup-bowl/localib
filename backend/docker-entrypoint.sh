#!/bin/sh
# Ensures the image storage directory is writable by the application user,
# then drops root privileges before starting the application.
#
# Bind-mounted host directories keep their host ownership (and are created as
# root if Docker has to create them), so the unprivileged app user cannot
# write to them. Starting as root lets us fix that once, then step down.
#
# Set PUID / PGID to run the application as a specific host user/group, so
# files written to the bind mount are owned by that user on the host.
set -eu

IMAGE_PATH="${LOCALIB_IMAGE_PATH:-/Images}"

if [ "$(id -u)" = "0" ]; then
	PUID="${PUID:-$(id -u discapp)}"
	PGID="${PGID:-$(id -g discapp)}"

	mkdir -p "$IMAGE_PATH"

	# Only walk the tree when ownership is wrong, so restarts stay fast on
	# large image libraries.
	if [ "$(stat -c '%u:%g' "$IMAGE_PATH")" != "$PUID:$PGID" ] \
		|| [ -n "$(find "$IMAGE_PATH" \( ! -user "$PUID" -o ! -group "$PGID" \) -print -quit)" ]; then
		echo "Setting ownership of $IMAGE_PATH to $PUID:$PGID"
		chown -R "$PUID:$PGID" "$IMAGE_PATH"
	fi

	if [ "$PUID" = "$(id -u discapp)" ]; then
		HOME="$(awk -F: '$1 == "discapp" { print $6 }' /etc/passwd)"
	else
		HOME=/tmp
	fi
	export HOME

	# Alpine ships su-exec; Ubuntu's util-linux provides a full setpriv
	# (BusyBox's setpriv cannot switch users).
	if command -v su-exec >/dev/null 2>&1; then
		exec su-exec "$PUID:$PGID" "$@"
	fi
	exec setpriv --reuid="$PUID" --regid="$PGID" --clear-groups -- "$@"
fi

# Already running unprivileged (e.g. started with --user); nothing to fix.
exec "$@"
