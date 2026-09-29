-- EUL4_BATCH_PACKAGE101213174001 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE101213174001 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE101213174001;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE101213174001 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '101213174001';
   batchReportId    NUMBER(22) := 118144;
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
                                     118150,
                                     1,
                                     'BRVC1 VARCHAR2(4000), BRVC2 VARCHAR2(4000), BRVC3 VARCHAR2(4000), BRVC4 VARCHAR2(4000), BRVC5 VARCHAR2(4000), BRD1 DATE, BRD2 DATE, BRVC6 VARCHAR2(4000), BRVC7 VARCHAR2(4000), BRVC8 VARCHAR2(4000), BRVC9 VARCHAR2(4000), BRVC10 VARCHAR2(12), BRVC11 VARCHAR2(4000), BRVC12 VARCHAR2(19), BRN1 NUMBER, BRN2 NUMBER, BRVC13 VARCHAR2(10), BRN3 NUMBER, BRD3 DATE, BRD4 DATE, BRD5 DATE, BRVC14 VARCHAR2(80), BRVC15 VARCHAR2(20), BRN4 NUMBER, BRVC16 VARCHAR2(160), BRVC17 VARCHAR2(4000), BRVC18 VARCHAR2(15), BRVC19 VARCHAR2(160), BRVC20 VARCHAR2(80), BRVC21 VARCHAR2(4000), BRD6 DATE, BRVC22 VARCHAR2(4000), BRN5 NUMBER, BRVC23 VARCHAR2(4000), BRVC24 VARCHAR2(40), BRVC25 VARCHAR2(40), BRVC26 VARCHAR2(40), BRVC27 VARCHAR2(40), BRVC28 VARCHAR2(40), BRVC29 VARCHAR2(40), BRVC30 VARCHAR2(40), BRVC31 VARCHAR2(4), BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRVC32 VARCHAR2(4000), BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER',
                                     'batch_rec.E_266, batch_rec.E_263, batch_rec.E_257, batch_rec.E_248, batch_rec.E_245, batch_rec.E_242, batch_rec.E_237, batch_rec.E_234, batch_rec.E_231, batch_rec.E_228, batch_rec.E_225, batch_rec.E115551, batch_rec.E115552, batch_rec.E115553, batch_rec.E115554, batch_rec.E115555, batch_rec.E115556, batch_rec.E115559, batch_rec.E115561, batch_rec.E115562, batch_rec.E115563, batch_rec.E115566, batch_rec.E115567, batch_rec.E115568, batch_rec.E115569, batch_rec.E115571, batch_rec.E115572, batch_rec.E115573, batch_rec.E115576, batch_rec.E115577, batch_rec.E115590, batch_rec.E115591, batch_rec.E115593, batch_rec.E115594, batch_rec.E115595, batch_rec.E115596, batch_rec.E115597, batch_rec.E115598, batch_rec.E115599, batch_rec.E115600, batch_rec.E115601, batch_rec.E115781, batch_rec.E_260, batch_rec.E_254, batch_rec.E115565, batch_rec.E115574, batch_rec.E115578, batch_rec.E115579, batch_rec.E115580, batch_rec.E115581, batch_rec.E115582, batch_rec.E115583, batch_rec.E115584, batch_rec.E115585, batch_rec.E115586, batch_rec.E115587, batch_rec.E115588, batch_rec.E115589',
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
END EUL4_BATCH_PACKAGE101213174001;
