INSERT INTO trackers (user_id,name,detail,type,target_value,unit,sort_order)
SELECT u.id, template.name, template.detail, template.type, template.target_value, template.unit, template.sort_order
FROM users u
CROSS JOIN (
    SELECT 'Wake before 7' name,'Before 7:00 AM' detail,'BOOLEAN' type,1 target_value,'' unit,1 sort_order
    UNION ALL SELECT 'Morning routine','6 step ritual','BOOLEAN',1,'',2
    UNION ALL SELECT 'Gym','Movement · 45 min','BOOLEAN',1,'',3
    UNION ALL SELECT 'Water','Daily target · 3 L','NUMBER',3,'L',4
    UNION ALL SELECT 'Study','Daily target · 120 min','DURATION',120,'min',5
    UNION ALL SELECT 'Reading','Daily target · 30 pages','NUMBER',30,'pages',6
    UNION ALL SELECT 'Meditation','Daily target · 15 min','DURATION',15,'min',7
    UNION ALL SELECT 'Mood','How today feels','RATING',10,'/10',8
) template
WHERE NOT EXISTS (SELECT 1 FROM trackers existing WHERE existing.user_id=u.id);
