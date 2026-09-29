-- EUL4_BATCH_PACKAGE110401095209 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE110401095209 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE110401095209;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE110401095209 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '110401095209';
   batchReportId    NUMBER(22) := 121874;
   batchReportRunNo NUMBER(22);
   batchReportRunId NUMBER(22);
   userName         VARCHAR2(129);
   rowFetchLimit    NUMBER(22);
   batchCommitSize  NUMBER(22);
   startDate        DATE := SYSDATE;
   error            BOOLEAN := FALSE;
BEGIN

   BEGIN
      IF (SIID_TESTES.EUL4_BATCH_USER.IsReportValid(eulSchemaName,
                                          batchReportId) = FALSE) THEN
           RETURN;
      END IF;
      SIID_TESTES.EUL4_BATCH_USER.GetUserLimits(eulSchemaName,
                                      batchReportId,
                                      userName,
                                      batchCommitSize,
                                      rowFetchLimit);
      SIID_TESTES.EUL4_BATCH_USER.SetExpiredRuns(eulSchemaName,
                                       userName);
      SIID_TESTES.EUL4_BATCH_USER.SetBatchReportRunInProgress(eulSchemaName,
                                                    batchReportId,
                                                    batchReportRunNo,
                                                    batchReportRunId);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     121876,
                                     1,
                                     'BRVC1 VARCHAR2(30), BRVC2 VARCHAR2(4), BRVC3 VARCHAR2(160), BRVC4 VARCHAR2(160), BRN1 NUMBER, BRVC5 VARCHAR2(3), BRVC6 VARCHAR2(3), BRVC7 VARCHAR2(4), BRVC8 VARCHAR2(4), BRN2 NUMBER, BRN3 NUMBER, BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER',
                                     'batch_rec.E110716, batch_rec.E110747, batch_rec.E110800, batch_rec.E110824, batch_rec.E110836, batch_rec.E110909, batch_rec.E110915, batch_rec.E110952, batch_rec.E110954, batch_rec.E_78, batch_rec.E_67, batch_rec.E110735, batch_rec.E110736, batch_rec.E110737, batch_rec.E110738, batch_rec.E110739, batch_rec.E110740, batch_rec.E110741, batch_rec.E110742, batch_rec.E110882, batch_rec.E110883, batch_rec.E110884, batch_rec.E110885, batch_rec.E110886, batch_rec.E110887, batch_rec.E110888, batch_rec.E110889',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

   EXCEPTION
      WHEN OTHERS THEN
         error := TRUE;
   END;
   SIID_TESTES.EUL4_BATCH_USER.ScheduleRun(eulSchemaName,
                                 timeStamp,
                                 batchReportId,
                                 batchReportRunId,
                                 batchReportRunNo,
                                 error,
                                 startDate);
END RUN;
END EUL4_BATCH_PACKAGE110401095209;
