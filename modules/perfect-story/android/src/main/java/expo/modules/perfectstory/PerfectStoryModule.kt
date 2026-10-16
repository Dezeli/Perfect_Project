package expo.modules.perfectstory

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.audio.SpeedProvider
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.Presentation
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.io.File
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

@OptIn(UnstableApi::class)
class PerfectStoryModule : Module() {
  private val exporting = AtomicBoolean(false)

  override fun definition() = ModuleDefinition {
    Name("PerfectStory")

    AsyncFunction("exportStory") { payload: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("STORY_CONTEXT", "영상 제작기를 준비하지 못했어요.", null)
        return@AsyncFunction
      }
      if (!exporting.compareAndSet(false, true)) {
        promise.reject("STORY_BUSY", "이전 스토리를 만드는 중이에요.", null)
        return@AsyncFunction
      }

      Handler(Looper.getMainLooper()).post {
        var output: File? = null
        try {
          val data = JSONObject(payload)
          val uri = Uri.parse(data.getString("mediaUri"))
          require(uri.scheme == "file" || uri.scheme == "content") { "기기에 있는 사진이나 영상만 사용할 수 있어요." }
          val isVideo = data.getString("kind") == "video"
          val overlay = drawOverlay(context, data)
          val effects = Effects(
            emptyList(),
            listOf(
              Presentation.createForWidthAndHeight(1080, 1920, Presentation.LAYOUT_SCALE_TO_FIT),
              OverlayEffect(listOf(BitmapOverlay.createStaticBitmapOverlay(overlay)))
            )
          )
          var clipDuration = 5000L
          val media = if (isVideo) {
            val retriever = MediaMetadataRetriever()
            val duration = try {
              retriever.setDataSource(context, uri)
              retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 5000L
            } finally { retriever.release() }
            require(duration > 0L) { "영상 길이를 읽을 수 없어요." }
            clipDuration = minOf(duration, 20_000L)
            MediaItem.Builder().setUri(uri).setClippingConfiguration(
              MediaItem.ClippingConfiguration.Builder().setEndPositionMs(clipDuration).build()
            ).build()
          } else {
            MediaItem.Builder().setUri(uri).setImageDurationMs(5000).build()
          }
          val itemBuilder = EditedMediaItem.Builder(media).setEffects(effects).setFrameRate(30).setRemoveAudio(true)
          if (isVideo) {
            val speed = (clipDuration / 5000f).coerceAtLeast(1f)
            itemBuilder.setSpeed(object : SpeedProvider {
              override fun getSpeed(timeUs: Long): Float = speed
              override fun getNextSpeedChangeTimeUs(timeUs: Long): Long = C.TIME_UNSET
            })
          }
          val item = itemBuilder.build()
          output = File(context.cacheDir, "perfect-story-${UUID.randomUUID()}.mp4")
          val destination = output!!
          val transformer = Transformer.Builder(context)
            .setVideoMimeType(MimeTypes.VIDEO_H264)
            .addListener(object : Transformer.Listener {
              override fun onCompleted(composition: Composition, exportResult: ExportResult) {
                exporting.set(false)
                promise.resolve(Uri.fromFile(destination).toString())
              }

              override fun onError(composition: Composition, exportResult: ExportResult, exportException: ExportException) {
                destination.delete()
                exporting.set(false)
                promise.reject("STORY_EXPORT", "스토리 영상을 만들지 못했어요.", exportException)
              }
            }).build()
          transformer.start(item, destination.absolutePath)
        } catch (error: Exception) {
          output?.delete()
          exporting.set(false)
          promise.reject("STORY_EXPORT", error.message ?: "스토리 영상을 만들지 못했어요.", error)
        }
      }
    }
  }

  private fun drawOverlay(context: android.content.Context, data: JSONObject): Bitmap {
    val bitmap = Bitmap.createBitmap(1080, 1920, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL) }
    fun panel(left: Float, top: Float, right: Float, bottom: Float, shade: Int, radius: Float = 22f) {
      paint.color = shade
      canvas.drawRoundRect(RectF(left, top, right, bottom), radius, radius, paint)
    }
    fun text(value: String, x: Float, y: Float, size: Float, shade: Int, bold: Boolean = false) {
      paint.typeface = Typeface.create(if (bold) "sans-serif-bold" else "sans-serif-medium", Typeface.NORMAL)
      paint.textSize = size
      paint.color = shade
      canvas.drawText(value, x, y, paint)
    }
    val cream = Color.rgb(243, 238, 219)
    val gold = Color.rgb(232, 192, 107)
    val muted = Color.rgb(175, 190, 164)
    panel(32f, 44f, 1048f, 262f, Color.argb(222, 19, 27, 18))
    text("완벽그자체", 66f, 122f, 57f, gold, true)
    val name = data.optString("name").take(10)
    text("$name 프로젝트", 66f, 188f, 52f, cream, true)
    text(data.optString("date"), 68f, 230f, 31f, muted)
    drawHero(canvas, paint, 872f, 72f)
    panel(846f, 207f, 1014f, 245f, Color.rgb(55, 48, 33), 10f)
    text("LV ${data.optInt("level", 1)}", 871f, 235f, 25f, gold, true)

    val planUri = data.optString("planUri")
    if (planUri.isNotBlank()) {
      panel(757f, 340f, 1045f, 762f, Color.argb(234, 29, 37, 27), 16f)
      text("HANDWRITTEN PLAN", 782f, 392f, 23f, gold, true)
      val plan = Uri.parse(planUri)
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      context.contentResolver.openInputStream(plan)?.use { BitmapFactory.decodeStream(it, null, bounds) }
      val sample = maxOf(1, maxOf(bounds.outWidth, bounds.outHeight) / 1024)
      val source = context.contentResolver.openInputStream(plan)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
      if (source != null) {
        val ratio = minOf(235f / source.width, 320f / source.height)
        val width = source.width * ratio
        val height = source.height * ratio
        val left = 782f + (235f - width) / 2f
        val top = 412f + (320f - height) / 2f
        paint.isFilterBitmap = true
        canvas.drawBitmap(source, null, RectF(left, top, left + width, top + height), paint)
        source.recycle()
      }
    }

    panel(32f, 1315f, 1048f, 1875f, Color.argb(230, 17, 25, 16))
    text("오늘의 퀘스트", 69f, 1397f, 48f, cream, true)
    text("${data.optInt("completed")}/${data.optInt("total")} 완료  ·  +${data.optInt("xp")} XP", 70f, 1448f, 30f, gold)
    val quests = data.optJSONArray("quests")
    if (quests != null) {
      for (i in 0 until minOf(quests.length(), 5)) {
        val quest = quests.optJSONObject(i) ?: continue
        val y = 1516f + i * 66f
        val done = quest.optString("status") == "completed"
        paint.color = if (done) Color.rgb(145, 192, 115) else Color.rgb(126, 139, 116)
        canvas.drawCircle(83f, y - 10f, 10f, paint)
        text(if (quest.optString("kind") == "sub") "S" else "M", 114f, y, 25f, gold, true)
        val title = quest.optString("title").take(40)
        paint.textSize = 34f
        var visible = title
        while (visible.isNotEmpty() && paint.measureText(visible) > 815f) visible = visible.dropLast(1)
        if (visible != title) visible = visible.dropLast(1) + "…"
        text(visible, 160f, y, 34f, cream)
      }
    }
    return bitmap
  }

  private fun drawHero(canvas: Canvas, paint: Paint, startX: Float, startY: Float) {
    val rows = listOf("....hhhh....", "...hhhhhh...", "...hssssh...", "...ssdsds...", "....ssss....", "..gggggggg..", ".gggGggGggg.", ".ssgGggGgss.", ".ssggggggss.", "...bbbbbb...", "...bb..bb...", "...bb..bb...", "..ddd..ddd..")
    val palette = mapOf('h' to Color.rgb(85, 67, 46), 's' to Color.rgb(230, 183, 140), 'd' to Color.rgb(48, 42, 34), 'g' to Color.rgb(115, 149, 96), 'G' to Color.rgb(196, 201, 129), 'b' to Color.rgb(92, 102, 92))
    for ((y, row) in rows.withIndex()) for ((x, pixel) in row.withIndex()) {
      val shade = palette[pixel] ?: continue
      paint.color = shade
      canvas.drawRect(startX + x * 9f, startY + y * 10f, startX + (x + 1) * 9f, startY + (y + 1) * 10f, paint)
    }
  }
}
