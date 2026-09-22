-- EUL4_BATCH_PACKAGE110401113030 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE110401113030 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE110401113030;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE110401113030 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '110401113030';
   batchReportId    NUMBER(22) := 122154;
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
                                     122165,
                                     1,
                                     'BRVC1 VARCHAR2(5), BRVC2 VARCHAR2(20), BRN1 NUMBER, BRVC3 VARCHAR2(30), BRVC4 VARCHAR2(30), BRVC5 VARCHAR2(80), BRVC6 VARCHAR2(4000), BRVC7 VARCHAR2(160), BRVC8 VARCHAR2(4000), BRD1 DATE, BRD2 DATE, BRN2 NUMBER, BRN3 NUMBER, BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER',
                                     'batch_rec.E110590, batch_rec.E110595, batch_rec.E110598, batch_rec.E110635, batch_rec.E110636, batch_rec.E110668, batch_rec.E110676, batch_rec.E110677, batch_rec.E110953, batch_rec.E110993, batch_rec.E110997, batch_rec.E_42, batch_rec.E_38, batch_rec.E_34, batch_rec.E_29, batch_rec.E_27, batch_rec.E_25, batch_rec.E_18, batch_rec.E110864, batch_rec.E110879, batch_rec.E110961, batch_rec.E110965',
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
END EUL4_BATCH_PACKAGE110401113030;
