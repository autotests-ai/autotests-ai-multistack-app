package dev.multistack.app.repository;

import dev.multistack.app.entity.NoteEntity;
import dev.multistack.app.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoteRepository extends JpaRepository<NoteEntity, Long> {

    Optional<NoteEntity> findByUser(UserEntity user);
}
