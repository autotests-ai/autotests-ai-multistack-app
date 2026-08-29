package api.model;

import java.util.List;

public record ItemsResponse(List<Item> items, String source) {
}
