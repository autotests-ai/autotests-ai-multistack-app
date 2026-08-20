package dev.multistack.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NotePutRequest(
        @NotNull @Size(max = 120) String title,
        @NotBlank @Size(min = 1, max = 2000) String text
) {
}
