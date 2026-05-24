$content = [System.IO.File]::ReadAllText("server/db.js")
$marker = "  if (queryText.includes('where d.concept_topic_id ='))"
$newHandlers = @"

  if (queryText.includes('select * from topics') && !queryText.includes('where')) {
    return { rows: mockTopics, rowCount: mockTopics.length };
  }

  if (queryText.includes('from vocabulary where topic_id =')) {
    const topicId = params[0];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const rows = VOCABULARY_DATA.filter(v => v.topic_name === topic.name)
      .map((v, i) => ({ id: topicId * 100 + i, topic_id: topicId, term: v.term, meaning: v.meaning, example_sentence: v.example_sentence }));
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('from quick_formulas where topic_id =')) {
    const topicId = params[0];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const rows = FORMULA_DATA.filter(f => f.topic_name === topic.name)
      .map((f, i) => ({ id: topicId * 100 + i, topic_id: topicId, formula_text: f.formula_text, use_when_hint: f.use_when_hint }));
    return { rows, rowCount: rows.length };
  }

  if (queryText.includes('from sqltricks') && queryText.includes('where t.topic_id =')) {
    const topicId = params[0];
    const userId = params[1];
    const topic = mockTopics.find(t => t.id === topicId);
    if (!topic) return { rows: [], rowCount: 0 };
    const topicTricks = TRICK_DATA.filter(t => t.topic_name === topic.name).map((t, i) => {
      const trickId = topicId * 100 + i + 1;
      const mastery = userTrickMasteryMemory.find(m => m.trick_id === trickId && m.user_id === userId);
      return { id: trickId, topic_id: topicId, position_order: t.position_order, name: t.name, spot_when: t.spot_when, method_steps_json: t.method_steps_json, worked_example_json: t.worked_example_json, trap_text: t.trap_text, long_vs_short_json: t.long_vs_short_json, difficulty: t.difficulty, attempts: mastery ? mastery.drills_attempted : 0, correct: mastery ? mastery.drills_correct : 0, best_avg_time_sec: mastery ? mastery.best_avg_time_sec : null, last_drilled_at: mastery ? mastery.last_drilled_at : null, mastery_score: mastery ? mastery.mastery_score : 0 };
    });
    return { rows: topicTricks, rowCount: topicTricks.length };
  }

"@
if ($content.Contains($marker)) {
    $newContent = $content.Replace($marker, $newHandlers + $marker)
    [System.IO.File]::WriteAllText("server/db.js", $newContent)
    Write-Host "DONE: Inserted mock handlers successfully."
} else {
    Write-Host "MARKER NOT FOUND in db.js"
}
