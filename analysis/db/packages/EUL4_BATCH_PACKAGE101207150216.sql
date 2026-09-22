-- EUL4_BATCH_PACKAGE101207150216 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE101207150216 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE101207150216;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE101207150216 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '101207150216';
   batchReportId    NUMBER(22) := 117503;
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
                                     117505,
                                     1,
                                     'BRVC1 VARCHAR2(4000), BRVC2 VARCHAR2(4000), BRD1 DATE, BRN1 NUMBER, BRN2 NUMBER, BRVC3 VARCHAR2(4000), BRVC4 VARCHAR2(4000), BRN3 NUMBER, BRVC5 VARCHAR2(40), BRVC6 VARCHAR2(40), BRVC7 VARCHAR2(20), BRN4 NUMBER, BRVC8 VARCHAR2(4000), BRD2 DATE, BRVC9 VARCHAR2(4000), BRVC10 VARCHAR2(4000), BRVC11 VARCHAR2(200), BRVC12 VARCHAR2(200), BRVC13 VARCHAR2(160), BRVC14 VARCHAR2(4000), BRVC15 VARCHAR2(4000), BRVC16 VARCHAR2(4000), BRVC17 VARCHAR2(80), BRVC18 VARCHAR2(4000), BRD3 DATE, BRD4 DATE, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRVC19 VARCHAR2(40), BRN8 NUMBER, BRN9 NUMBER, BRVC20 VARCHAR2(160), BRVC21 VARCHAR2(4000), BRN10 NUMBER, BRN11 NUMBER, BRD5 DATE, BRVC22 VARCHAR2(4000), BRVC23 VARCHAR2(4000), BRVC24 VARCHAR2(4000), BRVC25 VARCHAR2(80), BRVC26 VARCHAR2(80), BRVC27 VARCHAR2(40), BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER, BRN21 NUMBER, BRN22 NUMBER, BRN23 NUMBER, BRN24 NUMBER, BRN25 NUMBER, BRN26 NUMBER, BRN27 NUMBER, BRN28 NUMBER, BRN29 NUMBER, BRN30 NUMBER, BRN31 NUMBER, BRN32 NUMBER, BRN33 NUMBER, BRN34 NUMBER, BRN35 NUMBER',
                                     'batch_rec.E_791, batch_rec.E_788, batch_rec.E_785, batch_rec.E_766, batch_rec.E_762, batch_rec.E_752, batch_rec.E_750, batch_rec.E107476, batch_rec.E107481, batch_rec.E107520, batch_rec.E107523, batch_rec.E107532, batch_rec.E107544, batch_rec.E107614, batch_rec.E107664, batch_rec.E107665, batch_rec.E107673, batch_rec.E107676, batch_rec.E107692, batch_rec.E107721, batch_rec.E107724, batch_rec.E107725, batch_rec.E107728, batch_rec.E107732, batch_rec.E107740, batch_rec.E107747, batch_rec.E107752, batch_rec.E107753, batch_rec.E107755, batch_rec.E107757, batch_rec.E107828, batch_rec.E107831, batch_rec.E107844, batch_rec.E107980, batch_rec.E108001, batch_rec.E108007, batch_rec.E108016, batch_rec.E116205, batch_rec.E116206, batch_rec.E116207, batch_rec.E116208, batch_rec.E116209, batch_rec.E116210, batch_rec.E_796, batch_rec.E_794, batch_rec.E_783, batch_rec.E_781, batch_rec.E_779, batch_rec.E_776, batch_rec.E_773, batch_rec.E_760, batch_rec.E_757, batch_rec.E_754, batch_rec.E_747, batch_rec.E_745, batch_rec.E107498, batch_rec.E107516, batch_rec.E107668, batch_rec.E107870, batch_rec.E107918, batch_rec.E107950, batch_rec.E107983, batch_rec.E107997, batch_rec.E108024, batch_rec.E108025, batch_rec.E108064, batch_rec.E108127',
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
END EUL4_BATCH_PACKAGE101207150216;
