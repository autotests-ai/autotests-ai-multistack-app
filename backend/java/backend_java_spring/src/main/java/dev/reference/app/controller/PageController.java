package dev.reference.app.controller;

import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

/**
 * Soft client routes for any frontend packed into {@code classpath:/static}:
 * <ul>
 *   <li>MPA (vanilla, …): if {@code /{page}.html} exists → forward there</li>
 *   <li>SPA (React, Angular, …): otherwise → {@code /index.html} (client router)</li>
 * </ul>
 * API stays under {@code /api/**} and is never handled here.
 */
@Controller
public class PageController {

    private static final Set<String> RESERVED = Set.of(
            "api", "css", "js", "templates", "assets", "actuator", "error"
    );

    private final ResourceLoader resourceLoader;

    public PageController(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @GetMapping("/{page:[^\\.]+}")
    public String clientRoute(@PathVariable String page) {
        if (RESERVED.contains(page)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Resource mpaPage = resourceLoader.getResource("classpath:/static/" + page + ".html");
        if (mpaPage.exists() && mpaPage.isReadable()) {
            return "forward:/" + page + ".html";
        }
        return "forward:/index.html";
    }
}
