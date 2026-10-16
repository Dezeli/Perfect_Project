package expo.modules.perfectocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.DownloadStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PerfectOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PerfectOcr")

    AsyncFunction("recognize") { uri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("OCR_CONTEXT", "인식기를 준비하지 못했어요.", null)
        return@AsyncFunction
      }
      if (Uri.parse(uri).scheme != "file") {
        promise.reject("OCR_URI", "기기에 저장된 사진만 인식할 수 있어요.", null)
        return@AsyncFunction
      }
      val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
      try {
        val image = InputImage.fromFilePath(context, Uri.parse(uri))
        recognizer.process(image)
          .addOnSuccessListener { result -> promise.resolve(result.text) }
          .addOnFailureListener { error -> promise.reject("OCR_FAILED", "사진에서 글자를 읽지 못했어요.", error) }
          .addOnCompleteListener { recognizer.close() }
      } catch (error: Exception) {
        recognizer.close()
        promise.reject("OCR_IMAGE", "사진을 열지 못했어요.", error)
      }
    }

    AsyncFunction("aiStatus") Coroutine {
      val model = Generation.getClient()
      try {
        when (model.checkStatus()) {
          FeatureStatus.AVAILABLE -> "available"
          FeatureStatus.DOWNLOADABLE -> "downloadable"
          FeatureStatus.DOWNLOADING -> "downloading"
          else -> "unavailable"
        }
      } finally { model.close() }
    }

    AsyncFunction("downloadAi") Coroutine {
      val model = Generation.getClient()
      try {
        if (model.checkStatus() == FeatureStatus.DOWNLOADABLE) {
          model.download().collect { progress ->
            if (progress is DownloadStatus.DownloadFailed) throw progress.e
          }
        }
        if (model.checkStatus() != FeatureStatus.AVAILABLE) throw IllegalStateException("기기 AI가 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.")
      } finally { model.close() }
    }

    AsyncFunction("interpret") Coroutine { rawText: String ->
      val model = Generation.getClient()
      try {
        if (model.checkStatus() != FeatureStatus.AVAILABLE) throw IllegalStateException("기기 AI가 준비되지 않았어요.")
        val prompt = """너는 한국어 손글씨 OCR 결과를 일일 퀘스트로 정리한다.
OCR 오타를 문맥상 분명할 때만 고친다. 없는 목표는 만들지 않는다.
메인 퀘스트는 오늘 꼭 할 일 최대 3개, 서브 퀘스트는 여유가 있으면 할 일 최대 2개다.
원문에 구분이 없으면 중요한 목표를 메인으로 분류한다. 불명확한 문구는 추측하지 말고 제외한다.
JSON 객체 하나만 출력해라. 형식: {"main":["목표"],"sub":["목표"]}
OCR 원문:
${rawText.take(2500)}"""
        val response = model.generateContent(prompt)
        response.candidates.firstOrNull()?.text ?: throw IllegalStateException("AI가 해석 결과를 만들지 못했어요.")
      } finally { model.close() }
    }
  }
}
