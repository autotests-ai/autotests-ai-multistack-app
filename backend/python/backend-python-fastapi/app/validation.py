from __future__ import annotations

from typing import Any, Iterable

UNREADABLE_BODY_MESSAGE = "Request body is not valid JSON"


def validation_message(errors: Iterable[dict[str, Any]]) -> str:
    """
    Turns Pydantic errors into the reference error envelope.

    A location shorter than ``("body", "<field>")`` means the body never became an
    object at all (unreadable, empty, or a JSON array), which the reference reports as
    one flat message. Field failures are joined with "; " so a request that breaks
    several fields reports all of them, like the reference bean validation.
    """
    fields: list[str] = []
    for error in errors:
        location = error.get("loc", ())
        if len(location) < 2 or not isinstance(location[1], str):
            return UNREADABLE_BODY_MESSAGE
        if location[1] not in fields:
            fields.append(location[1])
    return "; ".join(f"{field} is invalid" for field in fields)
