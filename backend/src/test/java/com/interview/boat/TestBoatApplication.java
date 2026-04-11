package com.interview.boat;

import org.springframework.boot.SpringApplication;

public class TestBoatApplication {

	public static void main(String[] args) {
		SpringApplication.from(BoatApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
