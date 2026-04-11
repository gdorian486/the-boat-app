package com.interview.boat.repository;

import com.interview.boat.entity.Boat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface BoatRepository extends JpaRepository<Boat, UUID> {

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Boat boat where boat.id = :id")
	int deleteByIdReturningCount(@Param("id") UUID id);
}

