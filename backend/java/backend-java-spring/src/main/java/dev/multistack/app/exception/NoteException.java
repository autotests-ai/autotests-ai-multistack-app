package dev.multistack.app.exception;

public class NoteException extends RuntimeException {

    private final int status;

    public NoteException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
