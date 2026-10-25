package com.rollcore.live;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** STOMP destinations used by the live table session. */
public final class Destinations {

    private Destinations() {}

    private static final String UUID_RE = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

    /** Topics a member may subscribe to: {@code /topic/tables/{id}/(rolls|presence)}. */
    private static final Pattern TABLE_TOPIC = Pattern.compile("^/topic/tables/(" + UUID_RE + ")/(rolls|presence)$");

    /** Private error queue of the connected user. */
    public static final String USER_ERRORS = "/user/queue/errors";

    public static String rolls(UUID tableId)    { return "/topic/tables/" + tableId + "/rolls"; }
    public static String presence(UUID tableId) { return "/topic/tables/" + tableId + "/presence"; }

    /** Table id of a table topic, or {@code null} when the destination is not one. */
    public static UUID tableOf(String destination) {
        if (destination == null) return null;
        Matcher m = TABLE_TOPIC.matcher(destination);
        return m.matches() ? UUID.fromString(m.group(1)) : null;
    }

    public static boolean isPresenceTopic(String destination) {
        Matcher m = destination == null ? null : TABLE_TOPIC.matcher(destination);
        return m != null && m.matches() && "presence".equals(m.group(2));
    }
}
