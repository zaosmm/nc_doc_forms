from datetime import datetime, timedelta, date


def fill_event(component, calendar) -> dict[str, str]:
    cur = {}
    cur["calendar"] = f"{calendar}"
    cur["summary"] = component.get("summary")
    cur["description"] = component.get("description")
    cur["location"] = component.get("location")
    cur["start"] = component.start.strftime("%Y-%m-%d %H:%M:%S")
    cur["end"] = ''
    endDate = component.end
    if endDate:
        if isinstance(endDate, datetime):
            if endDate.hour == 0 and endDate.minute == 0 and endDate.second == 0:
                endDate = endDate - timedelta(days=1)
        elif isinstance(endDate, date):
            endDate = endDate - timedelta(days=1)
        cur["end"] = endDate.strftime("%Y-%m-%d %H:%M:%S")
    cur["datestamp"] = component.get("dtstamp").dt.strftime("%Y-%m-%d %H:%M:%S")
    return cur
