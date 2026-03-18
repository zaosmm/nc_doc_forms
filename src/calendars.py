def fill_event(component, calendar) -> dict[str, str]:
    cur = {}
    cur["calendar"] = f"{calendar}"
    cur["summary"] = component.get("summary")
    cur["description"] = component.get("description")
    cur["start"] = component.start.strftime("%Y-%m-%d %H:%M:%S")
    endDate = component.end
    if endDate:
        cur["end"] = endDate.strftime("%Y-%m-%d %H:%M:%S")
    cur["datestamp"] = component.get("dtstamp").dt.strftime("%Y-%m-%d %H:%M:%S")
    return cur
