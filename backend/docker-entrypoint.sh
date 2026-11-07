#!/bin/sh
# Ensures the image storage directory is writable by the application user,
# then drops root privileges before starting the application.
#
# Bind-mounted host directories keep their host ownership (and are created as
# root if Docker has to create them), so the unprivileged app user cannot
# write to them. Starting as root lets us fix that once, then step down.
#
# The app runs as UID/GID 1000 (the discapp user) by default. Set PUID / PGID
# to run it as a different host user/group instead; the image directory is
# always re-owned to whichever IDs the app runs as, so it stays writable.
set -eu

IMAGE_PATH="${LOCALIB_IMAGE_PATH:-/Images}"

if [ "$(id -u)" = "0" ]; then
	PUID="${PUID:-$(id -u discapp)}"
	PGID="${PGID:-$(id -g discapp)}"

	# Failures here are not fatal: the mount may be read-only or on storage
	# where root cannot chown (e.g. NFS with root_squash). In those cases, leave
	# ownership to the user.
	mkdir -p "$IMAGE_PATH" 2>/dev/null \
		|| echo "Warning: could not create $IMAGE_PATH" >&2

	# Only walk the tree when ownership is wrong, so restarts stay fast on
	# large image libraries.
	if [ "$(stat -c '%u:%g' "$IMAGE_PATH")" != "$PUID:$PGID" ] \
		|| [ -n "$(find "$IMAGE_PATH" \( ! -user "$PUID" -o ! -group "$PGID" \) -print -quit 2>/dev/null)" ]; then
		echo "Setting ownership of $IMAGE_PATH to $PUID:$PGID"
		chown -R "$PUID:$PGID" "$IMAGE_PATH" 2>/dev/null \
			|| echo "Warning: could not change ownership of $IMAGE_PATH; it may be read-only or not owned by this host." >&2
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
