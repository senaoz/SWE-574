from profanity_check import predict_prob  # type: ignore[import-untyped]

def is_offensive(text: str, threshold: float = 0.70) -> bool:
    score = float(predict_prob([text])[0])
    return score >= threshold
