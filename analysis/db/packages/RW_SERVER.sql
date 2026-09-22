-- RW_SERVER (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE rw_server IS

  /* Public Dataypes */

  -- Constants for p_repeat_pattern
  -- The value for <interval> or <weekday> or <day> is IN repeat_interval.

  NONE      CONSTANT NUMBER(2)   := 0;   -- job does not repeat
  MINUTES   CONSTANT NUMBER(2)   := 1;   -- every <interval> munites
  DAYS      CONSTANT NUMBER(2)   := 2;   -- every <interval> days
  MONTHS    CONSTANT NUMBER(2)   := 3;   -- every <interval> months
  FIRST     CONSTANT NUMBER(2)   := 4;   -- every 1st <weekday> of each month
  SECOND    CONSTANT NUMBER(2)   := 5;   -- every 2nd <weekday> of each month
  THIRD     CONSTANT NUMBER(2)   := 6;   -- every 3rd <weekday> of each month
  FOURTH    CONSTANT NUMBER(2)   := 7;   -- every 4th <weekday> of each month
  FIFTH     CONSTANT NUMBER(2)   := 8;   -- every 5th <weekday> of each month
  SUNDAY    CONSTANT NUMBER(2)   := 9;   -- last sunday of each month before <day>th
  MONDAY    CONSTANT NUMBER(2)   := 10;  -- last monday of each month before <day>th
  TUESDAY   CONSTANT NUMBER(2)   := 11;  -- last tuesday of each month before <day>th
  WEDNESDAY CONSTANT NUMBER(2)   := 12;  -- last wednesday of each month before <day>th
  THURSDAY  CONSTANT NUMBER(2)   := 13;  -- last thursday of each month before <day>th
  FRIDAY    CONSTANT NUMBER(2)   := 14;  -- last friday of each month before <day>th
  SATURDAY  CONSTANT NUMBER(2)   := 15;  -- last saturday of each month before <day>th
  WEEKDAY   CONSTANT NUMBER(2)   := 16;  -- last weekday of each month before <day>th
  WEEKEND   CONSTANT NUMBER(2)   := 17;  -- last weekend of each month before <day>th


  -- Constants for p_status_code and status_code in rw_server_queue table (same as zrcct_jstype)

  UNKNOWN           CONSTANT NUMBER(2) := 0; -- no such job
  ENQUEUED          CONSTANT NUMBER(2) := 1; -- job is waiting in queue
  OPENING           CONSTANT NUMBER(2) := 2; -- opening report
  RUNNING           CONSTANT NUMBER(2) := 3; -- running report
  FINISHED          CONSTANT NUMBER(2) := 4; -- job has finished
  TERMINATED_W_ERR  CONSTANT NUMBER(2) := 5; -- job has terminated with error
  CRASHED           CONSTANT NUMBER(2) := 6; -- engine has crashed when running
  CANCELED          CONSTANT NUMBER(2) := 7; -- job is canceled upon user request
  SERVER_SHUTDOWN   CONSTANT NUMBER(2) := 8; -- job is canceled as server is shut down
  WILL_RETRY        CONSTANT NUMBER(2) := 9; -- job has failed and is waiting for retrying
  SENDING_OUTPUT    CONSTANT NUMBER(2) := 10;-- job is sending its output
  TRANSFERED        CONSTANT NUMBER(2) := 11;-- job is transfered to another server in the cluster
  VOID_FINISHED     CONSTANT NUMBER(2) := 12;-- job is finished but void because of reaching limit of cache capacity
  ERROR_FINISHED    CONSTANT NUMBER(2) := 13;-- output is successfully generated but failed to send to destinations
  DISTRIBUTE        CONSTANT NUMBER(2) := 14;-- distributing reports output

  /* Public Functions */

  FUNCTION insert_job( p_job_queue       IN VARCHAR2,      -- States whether the job listed is CURRENT, COMPLETED, or SCHEDULED
                       p_job_id          IN NUMBER,        -- a generated job identification number
                       p_job_name        IN VARCHAR2,      -- the report name (or file name if no value for JOBNAME is specified)
                       p_status_code     IN NUMBER,        -- the current status of the job - see above constants
                       p_status_message  IN VARCHAR2,      -- the full status message
                       p_command_line    IN VARCHAR2,      -- all the command line parameters submitted for this report
                       p_owner           IN VARCHAR2,      -- the user that owns and submitted the job
                       p_destype         IN VARCHAR2,      -- the format of the report output
                       p_desname         IN VARCHAR2,      -- the name the report output will be written to (if not going to cache)
                       p_server          IN VARCHAR2,      -- name of server that is running the report
                       p_queued          IN DATE,          -- date and time this request was received and queued by the reports server
                       p_started         IN DATE,          -- date and time this reports started running
                       p_finished        IN DATE,          -- date and time this report completed
                       p_last_run        IN DATE,          -- date and time this report was last run
                       p_next_run        IN DATE,          -- date and time this report is scheduled to run next
                       p_repeat_interval IN NUMBER,        -- frequency that scheduled report will run
                       p_repeat_pattern  IN NUMBER,        -- Repeat Pattern (every minutes, hours, days, etc)
                       p_cache_key       IN VARCHAR2,      -- cache detection key
                       p_cache_hit       IN NUMBER,        -- whether the job has a cache hit
                       p_job_type        IN VARCHAR2 DEFAULT 'report', -- job type defined in server config file
                       p_run_elapse      IN NUMBER,        -- elapse time between started and finished time,
                                                           -- in unit of milliseconds
                       p_total_elapse    IN NUMBER)        -- elapse time between queued and finished time,
                                                           -- in unit of milliseconds
  RETURN NUMBER;

  FUNCTION remove_job( p_job_id          IN NUMBER,        -- job id number
                       p_server          IN VARCHAR2)      -- server name
  RETURN NUMBER;

  FUNCTION clean_up_queue RETURN NUMBER;


END rw_server;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY rw_server IS

  FUNCTION insert_job( p_job_queue       IN VARCHAR2,
                       p_job_id          IN NUMBER,
                       p_job_name        IN VARCHAR2,
                       p_status_code     IN NUMBER,
                       p_status_message  IN VARCHAR2,
                       p_command_line    IN VARCHAR2,
                       p_owner           IN VARCHAR2,
                       p_destype         IN VARCHAR2,
                       p_desname         IN VARCHAR2,
                       p_server          IN VARCHAR2,
                       p_queued          IN DATE,
                       p_started         IN DATE,
                       p_finished        IN DATE,
                       p_last_run        IN DATE,
                       p_next_run        IN DATE,
                       p_repeat_interval IN NUMBER,
                       p_repeat_pattern  IN NUMBER,
                       p_cache_key       IN VARCHAR2,
                       p_cache_hit       IN NUMBER,
                       p_job_type        IN VARCHAR2,
                       p_run_elapse      IN NUMBER,
                       p_total_elapse    IN NUMBER)
  RETURN NUMBER IS
  BEGIN
    INSERT INTO rw_server_job_queue VALUES (
      p_job_queue,
      p_job_id,
      p_job_type,
      p_job_name,
      p_status_code,
      p_status_message,
      p_command_line,
      p_owner,
      p_destype,
      p_desname,
      p_server,
      p_queued,
      p_started,
      p_finished,
      p_run_elapse,
      p_total_elapse,
      p_last_run,
      p_next_run,
      p_repeat_interval,
      p_repeat_pattern,
      p_cache_key,
      p_cache_hit);
    COMMIT;
    RETURN (SQLCODE);
  EXCEPTION
    WHEN OTHERS THEN RETURN (SQLCODE);
  END insert_job;

  FUNCTION remove_job( p_job_id   IN NUMBER,
                       p_server   IN VARCHAR2)
  RETURN NUMBER IS
  BEGIN
    DELETE FROM rw_server_job_queue WHERE job_id = p_job_id AND
                                      server = p_server;
    COMMIT;
    RETURN(SQLCODE);
  EXCEPTION
    WHEN OTHERS THEN RETURN (SQLCODE);
  END remove_job;

  FUNCTION clean_up_queue RETURN NUMBER IS
    stmt         VARCHAR2(2000);
    stmt_cursor  NUMBER;
    dummy        NUMBER;
  BEGIN
    stmt        := 'TRUNCATE TABLE RW_SERVER_JOB_QUEUE';
    stmt_cursor := dbms_sql.open_cursor;
    dbms_sql.parse(stmt_cursor, stmt, dbms_sql.v7);
    dummy       := dbms_sql.execute(stmt_cursor);
    dbms_sql.close_cursor(stmt_cursor);
    COMMIT;
    RETURN (SQLCODE);
  EXCEPTION
    WHEN OTHERS THEN RETURN (SQLCODE);
  END clean_up_queue;

END rw_server;
