package dev.multistack.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * `css/panel.css` `.panel.panel--content` — 1px shell, 8px radius, 26px bar
 * with the three decorative dots and an 11px/600 muted title.
 */
@Composable
fun Panel(
    title: String,
    modifier: Modifier = Modifier,
    titleTestId: String? = null,
    bodyArrangement: Arrangement.Vertical = Arrangement.spacedBy(Space.x3),
    body: @Composable ColumnScope.() -> Unit,
) {
    val palette = LocalPalette.current
    Column(
        modifier = modifier
            .border(1.dp, palette.border, RoundedCornerShape(Metrics.radiusSm))
            .background(palette.surfaceSoft, RoundedCornerShape(Metrics.radiusSm)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(Metrics.panelBarHeight)
                .background(palette.panelBar)
                .padding(start = Space.x3, end = Space.x2),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Space.x2),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(Metrics.panelDotGap)) {
                Dot(palette.dotClose)
                Dot(palette.dotMinimize)
                Dot(palette.dotMaximize)
            }
            Text(
                text = title,
                color = palette.textMuted,
                fontSize = FontSize.xs,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = titleTestId?.let { Modifier.testId(it) } ?: Modifier,
            )
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(palette.border))
        Column(
            modifier = Modifier.fillMaxWidth().padding(Space.x4),
            verticalArrangement = bodyArrangement,
        ) {
            body()
        }
    }
}

@Composable
private fun Dot(color: Color) {
    Box(Modifier.size(Metrics.panelDotSize).background(color, CircleShape))
}

enum class BtnVariant { PRIMARY, DANGER }

/** `css/button.css` `.btn.btn--primary` / `.btn--danger`, `.btn--block`. */
@Composable
fun Btn(
    label: String,
    onClick: () -> Unit,
    testId: String,
    modifier: Modifier = Modifier,
    variant: BtnVariant = BtnVariant.PRIMARY,
    block: Boolean = false,
    enabled: Boolean = true,
) {
    val palette = LocalPalette.current
    val background = if (variant == BtnVariant.PRIMARY) palette.primary else palette.danger
    val foreground = if (variant == BtnVariant.PRIMARY) palette.primaryOn else palette.surface
    Box(
        modifier = modifier
            .then(if (block) Modifier.fillMaxWidth() else Modifier)
            .alpha(if (enabled) 1f else 0.5f)
            .background(background, RoundedCornerShape(Metrics.radiusSm))
            .clickable(enabled = enabled, onClick = onClick)
            .defaultMinSize(minHeight = Metrics.controlHeight)
            .padding(horizontal = Space.x4, vertical = Space.x2)
            .testId(testId),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = foreground,
            fontSize = FontSize.base,
            fontWeight = FontWeight.Medium,
        )
    }
}

/**
 * `css/plaque-field.css` `.plaque-field--divided` with a human caption:
 * caption `.plaque-field__text` | `.plaque-divider` | right-aligned control.
 */
@Composable
fun PlaqueField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    testId: String,
    modifier: Modifier = Modifier,
    password: Boolean = false,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {},
) {
    val palette = LocalPalette.current
    var focused by remember { mutableStateOf(false) }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(Metrics.plaqueHeight)
            .border(
                1.dp,
                if (focused) palette.primary else palette.border,
                RoundedCornerShape(Metrics.radiusSm),
            )
            .background(palette.surface, RoundedCornerShape(Metrics.radiusSm))
            .padding(horizontal = Space.x2),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Space.x2),
    ) {
        Text(
            text = label,
            color = palette.text,
            fontSize = FontSize.sm,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        PlaqueDivider()
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .weight(1f)
                // `input.plaque-field__control` reserves the select-chevron trail.
                .padding(end = 30.dp)
                .onFocusChanged { focused = it.isFocused }
                .testId(testId),
            singleLine = true,
            textStyle = TextStyle(
                color = palette.text,
                fontSize = FontSize.sm,
                textAlign = TextAlign.End,
            ),
            cursorBrush = SolidColor(palette.primary),
            visualTransformation = if (password) {
                PasswordVisualTransformation()
            } else {
                VisualTransformation.None
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = if (password) KeyboardType.Password else KeyboardType.Text,
                imeAction = imeAction,
            ),
            keyboardActions = KeyboardActions(
                onDone = { onImeAction() },
                onGo = { onImeAction() },
                onNext = { onImeAction() },
            ),
        )
    }
}

/** `css/plaque-divider.css` — fixed 1px rule, height `--font-size-sm * 1.35`. */
@Composable
fun PlaqueDivider(modifier: Modifier = Modifier) {
    val palette = LocalPalette.current
    Box(modifier.width(1.dp).height(19.dp).background(palette.border))
}

/** `.link--nav` — 12px/500, underlined; active drops the underline. */
@Composable
fun NavLink(
    label: String,
    onClick: () -> Unit,
    testId: String,
    active: Boolean,
    modifier: Modifier = Modifier,
) {
    val palette = LocalPalette.current
    Text(
        text = label,
        color = palette.text,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        textDecoration = if (active) TextDecoration.None else TextDecoration.Underline,
        maxLines = 1,
        modifier = modifier.clickable(onClick = onClick).testId(testId),
    )
}

/** `.link` inside body copy (register / login footer links). */
@Composable
fun InlineLink(
    label: String,
    onClick: () -> Unit,
    testId: String,
    modifier: Modifier = Modifier,
) {
    val palette = LocalPalette.current
    Text(
        text = label,
        color = palette.primary,
        fontSize = FontSize.sm,
        modifier = modifier.clickable(onClick = onClick).testId(testId),
    )
}

/** `.icon-btn` — 36px hit area around an 18px glyph. */
@Composable
fun IconBtn(
    icon: ImageVector,
    onClick: () -> Unit,
    testId: String,
    modifier: Modifier = Modifier,
    tint: Color? = null,
    trailing: (@Composable BoxScope.() -> Unit)? = null,
) {
    val palette = LocalPalette.current
    Box(
        modifier = modifier
            .size(Metrics.controlHeight)
            .clickable(onClick = onClick)
            .testId(testId),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint ?: palette.text,
            modifier = Modifier.size(Metrics.iconSize),
        )
        trailing?.invoke(this)
    }
}

@Composable
fun VSpace(height: Dp) {
    Spacer(Modifier.height(height))
}
