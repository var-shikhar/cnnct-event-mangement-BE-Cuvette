const RouteCode = {
    SUCCESS: { statusCode: 200, message: "OK" },
    CREATED: { statusCode: 201, message: "Created" },
    ACCEPTED: { statusCode: 202, message: "Accepted" },
    NO_CONTENT: { statusCode: 204, message: "No Content" },
    MOVED_PERMANENTLY: { statusCode: 301, message: "Moved Permanently" },
    FOUND: { statusCode: 302, message: "Found" },
    SEE_OTHER: { statusCode: 303, message: "See Other" },
    NOT_MODIFIED: { statusCode: 304, message: "Not Modified" },
    TEMPORARY_REDIRECT: { statusCode: 307, message: "Temporary Redirect" },
    PERMANENT_REDIRECT: { statusCode: 308, message: "Permanent Redirect" },
    BAD_REQUEST: { statusCode: 400, message: "Bad Request" },
    UNAUTHORIZED: { statusCode: 401, message: "Unauthorized" },
    FORBIDDEN: { statusCode: 403, message: "Forbidden" },
    NOT_FOUND: { statusCode: 404, message: "Not Found" },
    METHOD_NOT_ALLOWED: { statusCode: 405, message: "Method Not Allowed" },
    CONFLICT: { statusCode: 409, message: "Conflict" },
    GONE: { statusCode: 410, message: "Gone" },
    PRECONDITION_FAILED: { statusCode: 412, message: "Precondition Failed" },
    PAYLOAD_TOO_LARGE: { statusCode: 413, message: "Payload Too Large" },
    URI_TOO_LONG: { statusCode: 414, message: "URI Too Long" },
    UNSUPPORTED_MEDIA_TYPE: { statusCode: 415, message: "Unsupported Media Type" },
    RANGE_NOT_SATISFIABLE: { statusCode: 416, message: "Range Not Satisfiable" },
    EXPECTATION_FAILED: { statusCode: 417, message: "Expectation Failed" },
    UPGRADE_REQUIRED: { statusCode: 426, message: "Upgrade Required" },
    PRECONDITION_REQUIRED: { statusCode: 428, message: "Precondition Required" },
    TOO_MANY_REQUESTS: { statusCode: 429, message: "Too Many Requests" },
    REQUEST_HEADER_FIELDS_TOO_LARGE: { statusCode: 431, message: "Request Header Fields Too Large" },
    UNAVAILABLE_FOR_LEGAL_REASONS: { statusCode: 451, message: "Unavailable For Legal Reasons" },
    LOGOUT_REQESTED: { statusCode: 440, message: "Something went wrong, please Login again!" },
    SERVER_ERROR: { statusCode: 500, message: "Internal Server Error" },
    NOT_IMPLEMENTED: { statusCode: 501, message: "Not Implemented" },
    BAD_GATEWAY: { statusCode: 502, message: "Bad Gateway" },
    SERVICE_UNAVAILABLE: { statusCode: 503, message: "Service Unavailable" },
    GATEWAY_TIMEOUT: { statusCode: 504, message: "Gateway Timeout" },
    HTTP_VERSION_NOT_SUPPORTED: { statusCode: 505, message: "HTTP Version Not Supported" },
    VARIANT_ALSO_NEGOTIATES: { statusCode: 506, message: "Variant Also Negotiates" },
    INSUFFICIENT_STORAGE: { statusCode: 507, message: "Insufficient Storage" },
    LOOP_DETECTED: { statusCode: 508, message: "Loop Detected" },
    NOT_EXTENDED: { statusCode: 510, message: "Not Extended" },
    NETWORK_AUTHENTICATION_REQUIRED: { statusCode: 511, message: "Network Authentication Required" }
};


export default RouteCode