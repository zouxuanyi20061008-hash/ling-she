"""V34: guarded restore of *owner-imported* case archive from owner JSON backup.

Never restores visitor activity or visitor-submitted cases. All imported case
payloads are sanitized again before insertion, and existing ids are immutable.
"""
from __future__ import annotations
import hashlib
import json
from .experience_case_archive import parse_shared_case, CaseImportError, CONSENT

CLOUD_BACKUP_FORMAT="wanxiang-owner-cloud-backup-v2"
MAX_RESTORE_BYTES=2_000_000
MAX_RESTORE_CASES=100
VALID_STATUSES={"pending","approved","rejected"}


def parse_owner_imported_backup(raw):
    """Return fully validated DB insert tuples; never mutate storage during parse."""
    if not isinstance(raw,str) or len(raw.encode("utf-8"))>MAX_RESTORE_BYTES:
        raise CaseImportError("云端备份超过2MB，或文件无效；每次最多恢复100份站长导入案例")
    try:
        backup=json.loads(raw)
    except (ValueError,TypeError):
        raise CaseImportError("无法解析站长云端备份 JSON") from None
    if not isinstance(backup,dict):
        raise CaseImportError("备份格式错误")
    modern=(backup.get("format")==CLOUD_BACKUP_FORMAT and backup.get("version")==2)
    legacy=("format" not in backup and "version" not in backup and
            all(k in backup for k in ("exported_at","cases","events","owner_imported_cases")))
    if not modern and not legacy:
        raise CaseImportError("只能恢复万象书院站长后台导出的历史 JSON 备份")
    rows=backup.get("owner_imported_cases")
    if not isinstance(rows,list) or len(rows)>MAX_RESTORE_CASES:
        raise CaseImportError("站长导入案例列表格式无效或超过100份")
    seen=set()
    restored=[]
    for row in rows:
        if not isinstance(row,dict):
            raise CaseImportError("存在格式无效的备份案例")
        source=row.get("source_key")
        if not isinstance(source,str) or not source or len(source)>120:
            raise CaseImportError("备份来源编号无效")
        ident=hashlib.sha256(source.encode("utf-8")).hexdigest()
        if row.get("id")!=ident:
            raise CaseImportError("备份案例校验失败：来源编号与原始ID不一致")
        if ident in seen:
            raise CaseImportError("备份中存在重复的案例编号")
        seen.add(ident)
        status=row.get("status")
        if status not in VALID_STATUSES:
            raise CaseImportError("备份审核状态无效")
        note=row.get("reviewer_note","")
        if not isinstance(note,str) or len(note)>600 or "\x00" in note:
            raise CaseImportError("站长审核备注无效或超过600字")
        dt=row.get("imported_at","")
        if not isinstance(dt,str) or len(dt)>60:
            raise CaseImportError("案例入库时间字段无效")
        candidate={
            "format":"wanxiang-sixyao-case-v1","version":1,
            "consent":CONSENT,"source_key":source,"case":row.get("case"),
        }
        cleaned=parse_shared_case(json.dumps(candidate,ensure_ascii=False))
        if cleaned["id"]!=ident:
            raise CaseImportError("备份来源编号校验失败")
        # Never trust uploaded verification labels or arbitrary extra attributes.
        raw_payload=json.dumps(cleaned,ensure_ascii=False)
        restored.append((ident,source,dt,status,raw_payload,note))
    return restored
